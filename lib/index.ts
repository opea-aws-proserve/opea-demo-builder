import { AccessEntry, AccessEntryType, AccessPolicyArn, AccessScopeType, AuthenticationMode, Cluster, DefaultCapacityType, EndpointAccess, KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getClusterLogLevel, getKVersion } from "./util";
import { KubectlLayer } from "aws-cdk-lib/lambda-layer-kubectl";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { InstanceClass, InstanceSize, InstanceType, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import * as Constants from './constants.json';
import { Size, Stack } from "aws-cdk-lib";
import { OpeaEksProps } from "./types";
import { KubernetesModule } from "./helpers/kubernetes-module";
import { networkInterfaces } from "os";
import { NodeProxyAgentLayer } from "aws-cdk-lib/lambda-layer-node-proxy-agent";


export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    vpc:Vpc;
    
    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]
    constructor(
        scope: Construct, 
        id: string, 
        props: OpeaEksProps
    ) {
        super(scope, id);

        this.vpc = new Vpc(this, "ChatQnaVpc", {
            subnetConfiguration: [
                {
                    name: 'publicSubnet',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24 // Defines the size of each subnet as a smaller part of the VPC CIDR block
                },
                {
                    name: 'privateSubnet',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24
                },
            ],
            maxAzs:2
        })
//TODO - add volume /mnt/opea-models
        const instanceType = props.instanceType || InstanceType.of(InstanceClass.M7I, InstanceSize.XLARGE24);
        this.cluster = new Cluster(this, `${id}-opea-eks-cluster`, {            
            kubectlLayer: new KubectlLayer(this, `${id}-kubectl-layer`),
            awscliLayer: new AwsCliLayer(this, `${id}-awscli-layer`),
            onEventLayer: new NodeProxyAgentLayer(this, `${id}-node-proxy-agent-layer`),
            vpc: this.vpc,
            /*albController: {
                version: getAlbVersion(props?.albVersion),
                repository: props?.repository ? props.repository.repositoryUri : undefined
            },*/
            defaultCapacityType: DefaultCapacityType.EC2,
            defaultCapacityInstance: instanceType,
            defaultCapacity: 2,
            kubectlMemory: Size.mebibytes(2048),
            endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
            ...(props?.clusterProps || {}),
            version: props?.clusterProps?.version || getKVersion(props.kubernetesVersion),
            clusterHandlerEnvironment: {
                HUGGINGFACEHUB_API_TOKEN: props.huggingFaceToken || "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";  // TODO - remove this
                host_ip: "",
                no_proxy: "localhost",
                ...(props?.environmentVariables || {}), 
                ...(props?.clusterProps?.clusterHandlerEnvironment || {})
            },
            clusterLogging: getClusterLogLevel(props?.logLevel, props?.clusterProps?.clusterLogging),
            clusterName: props?.clusterName || props?.clusterProps?.clusterName || `${id}-opea-eks-cluster`,
            kubectlEnvironment: {
                HUGGINGFACEHUB_API_TOKEN: props.huggingFaceToken || "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";  // TODO - remove this
                host_ip: "",
                no_proxy: "localhost",
                ...(props?.environmentVariables || {}),
                ...(props?.clusterProps?.kubectlEnvironment || {})
            },
            authenticationMode: AuthenticationMode.API_AND_CONFIG_MAP
        });

        this.cluster.addNodegroupCapacity(`${id}-node-group`, {
            instanceTypes: [instanceType, ...(props.additionalInstanceTypes || [])],
            desiredSize: 1,
            maxSize: 2,
            nodegroupName: `${id}-node-group`
        });

        const moduleOptions = props.moduleOptions || {}
        const containers = props.containers?.length ? props.containers : [""];
        new AccessEntry(this, `${id}-access-entry`, {
            cluster: this.cluster,
            accessEntryType: "STANDARD" as any,
            principal: process.env.PARTICIPANT_ASSUMED_ROLE_ARN || props.principal || `arn:aws:iam::${Stack.of(this).account}:role/Admin`,
            accessPolicies: [
                {
                    accessScope: {
                        type: AccessScopeType.CLUSTER
                    },
                    policy: AccessPolicyArn.AMAZON_EKS_CLUSTER_ADMIN_POLICY.policyArn

                },
                {
                    accessScope: {
                        type: AccessScopeType.NAMESPACE,
                        namespaces: containers,
                    },
                    policy: AccessPolicyArn.AMAZON_EKS_ADMIN_POLICY.policyArn
                }
            ]
        });

        containers.forEach(container => {
            const usedNames:string[] = [];
            let namespace:KubernetesManifest;
            if (container) {
                moduleOptions.containerName = container
                namespace = this.cluster.addManifest(`${container}-namespace`, {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: container
                    }
                })
            }
            
            const kb = new KubernetesModule(props.module, moduleOptions);
            kb.assets.forEach(asset => {
                if (container) asset.metadata.namespace = container;
                if (usedNames.includes(asset.metadata.name)) asset.metadata.name = `${asset.metadata.name}-${asset.kind.toLowerCase()}`
                else usedNames.push(asset.metadata.name);
                const manifest = this.cluster.addManifest(`${container}-${asset.kind}-${asset.metadata.name}`, asset);
                if (container) manifest.node.addDependency(namespace);
            })
        });        
    }
}