import { Cluster, DefaultCapacityType, HelmChart } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getAlbVersion, getClusterLogLevel, getKVersion } from "./util";
import { KubectlLayer } from "aws-cdk-lib/lambda-layer-kubectl";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import * as Constants from './constants.json';
import { Size } from "aws-cdk-lib";
import { OpeaEksProps } from "./types";
import { KubernetesModule } from "./helpers/kubernetes-module";
import path = require("path");
import { Asset } from "aws-cdk-lib/aws-s3-assets";

export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    helmChart: HelmChart
    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]
    constructor(
        scope: Construct, 
        id: string, 
        props: OpeaEksProps
    ) {
        super(scope, id);
        this.cluster = new Cluster(this, `${id}-opea-eks-cluster`, {            
            kubectlLayer: new KubectlLayer(this, `${id}-kubectl-layer`),
            awscliLayer: new AwsCliLayer(this, `${id}-awscli-layer`),
            albController: {
                version: getAlbVersion(props?.albVersion),
                repository: props?.repository ? props.repository.repositoryUri : undefined
            },
            defaultCapacityType: DefaultCapacityType.EC2,
            defaultCapacityInstance: InstanceType.of(InstanceClass.MEMORY7_INTEL, InstanceSize.XLARGE24),
            defaultCapacity: 1,
            kubectlMemory: Size.mebibytes(2048),
            ...(props?.clusterProps || {}),
            version: props?.clusterProps?.version || getKVersion(props.kubernetesVersion),
            clusterHandlerEnvironment: {
                ...(props?.environmentVariables || {}), 
                ...(props?.clusterProps?.clusterHandlerEnvironment || {})
            },
            clusterLogging: getClusterLogLevel(props?.logLevel, props?.clusterProps?.clusterLogging),
            clusterName: props?.clusterName || props?.clusterProps?.clusterName || `${id}-opea-eks-cluster`,
            kubectlEnvironment: {
                ...(props?.environmentVariables || {}),
                ...(props?.clusterProps?.kubectlEnvironment || {})
            },
        });
        const moduleOptions = props.moduleOptions || {}
        const containers = props.containers?.length ? props.containers : [""];
        const kbs = containers.map(container => {
            if (container) moduleOptions.containerName = container
            const kb = new KubernetesModule(props.module, moduleOptions);
            kb.writeYml(props.module)
            return kb;
        });
        const filename = kbs[0].filename;
        const pathname = kbs.length > 1 ? path.dirname(filename) : filename;
        const opt = props.helmChartOptions || {};
        this.helmChart = this.cluster.addHelmChart(`${id}-helm-chart`, {
            createNamespace: true,
            namespace: props.module,
            ...opt,
            chartAsset: new Asset(this, `${id}-helm-chart-asset`, {
                path: pathname,
                deployTime: true
            })
        })
    }
}