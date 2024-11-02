import { Cluster, ClusterProps, DefaultCapacityType } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getAlbVersion, getClusterLogLevel, getKVersion } from "./util";
import { KubectlLayer } from "aws-cdk-lib/lambda-layer-kubectl";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import * as Constants from './constants.json';
import { Size } from "aws-cdk-lib";

type StringObject = {
    [key: string]: string
}

type AnyObject = {
    [key: string]: any
}
export interface OpeaEksProps {
    module?: string
    clusterName?: string
    kubernetesVersion?: string
    albVersion?: string
    repository?: Repository
    clusterProps?: Partial<ClusterProps>
    environmentVariables?: StringObject
    logLevel?: string
    assetPaths?: string[]
    helmValues?: AnyObject
}

export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]
    constructor(scope: Construct, id: string, props: OpeaEksProps = {}) {
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

        this.cluster.addHelmChart(`${id}-helm-chart`, {

        })
    }
}