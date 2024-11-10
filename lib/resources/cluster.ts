import { AccessEntry, AccessPolicyArn, AccessScopeType, AlbControllerVersion, AuthenticationMode, Cluster, DefaultCapacityType, EndpointAccess, KubernetesManifest, KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getClusterLogLevel } from "../util";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { FlowLogDestination, InstanceClass, InstanceSize, InstanceType, Peer, Port, PrefixList, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import * as Constants from '../constants.json';
import { Fn, Size, Stack } from "aws-cdk-lib";
import { OpeaEksProps } from "../types";
import { NodeProxyAgentLayer } from "aws-cdk-lib/lambda-layer-node-proxy-agent";
import { HuggingFaceToken } from "../constants";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { KubernetesModule } from "../helpers/kubernetes-module";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    vpc:Vpc;
    securityGroup: SecurityGroup
    
    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]
    constructor(
        scope: Construct, 
        protected id: string, 
        protected props: OpeaEksProps
    ) {
        super(scope, id);

        this.vpc = new Vpc(this, "OpeaVpc", {
            subnetConfiguration: [
                {
                    name: 'publicSubnet',
                    subnetType: SubnetType.PUBLIC,
                   // cidrMask: 24 // Defines the size of each subnet as a smaller part of the VPC CIDR block
                },
               /* {
                    name: 'privateSubnet',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24
                },*/
            ],   
            flowLogs: {
                BriefingFlowLogs: {
                    destination: FlowLogDestination.toCloudWatchLogs()
                }
            },
           // availabilityZones: Fn.getAzs(Stack.of(this).region)
        })

        const sg1 = new SecurityGroup(this, `${id}-sg1`, { 
            vpc:this.vpc,
            allowAllOutbound:true,
            securityGroupName:`${id}-sg1`
        });
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(80))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(443))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(7000))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(8001))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(8888))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(5173))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(6379))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(6007))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(2080))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(2081))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(2082))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(2083))
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(9090))

        sg1.connections.allowFrom(Peer.prefixList(this.getPrefixListId()), Port.allTcp());
        this.securityGroup = sg1;
        //TODO - add volume /mnt/opea-models
        const instanceType = props.instanceType || InstanceType.of(InstanceClass.M7I, InstanceSize.XLARGE24);
        this.cluster = new Cluster(this, `opea-eks-cluster`, {            
            kubectlLayer: new KubectlV31Layer(this, `${id}-kubectl-layer`),
            awscliLayer: new AwsCliLayer(this, `${id}-awscli-layer`),
            onEventLayer: new NodeProxyAgentLayer(this, `${id}-node-proxy-agent-layer`),
            vpc: this.vpc,
            vpcSubnets: [{subnetType:SubnetType.PUBLIC}],
            albController: {
                version: AlbControllerVersion.V2_8_2
            },
            defaultCapacityType: DefaultCapacityType.EC2,
            defaultCapacityInstance: instanceType,
            defaultCapacity: 2,
            kubectlMemory: Size.mebibytes(2048),
            endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
            ...(props?.clusterProps || {}),
            version: KubernetesVersion.V1_31,
            clusterHandlerEnvironment: {
                HUGGINGFACEHUB_API_TOKEN: HuggingFaceToken,
            //    host_ip: "",
            //    no_proxy: "localhost",
                ...(props?.environmentVariables || {}), 
                ...(props?.clusterProps?.clusterHandlerEnvironment || {})
            },
            clusterLogging: getClusterLogLevel(props?.logLevel, props?.clusterProps?.clusterLogging),
            clusterName: `opea-eks-cluster`,
            kubectlEnvironment: {
                HUGGINGFACEHUB_API_TOKEN: HuggingFaceToken,
                //host_ip: "",
                //no_proxy: "localhost",
                ...(props?.environmentVariables || {}),
                ...(props?.clusterProps?.kubectlEnvironment || {})
            },
            authenticationMode: AuthenticationMode.API_AND_CONFIG_MAP
        });

       /* this.cluster.addNodegroupCapacity(`${id}-node-group`, {
            instanceTypes: [instanceType, ...(props.additionalInstanceTypes || [])],
            desiredSize: 1,
            maxSize: 1,
            diskSize: 50,
            nodegroupName: `${id}-nodegroup`,
            remoteAccess: process.env.KeyPair ? {
                sshKeyName: process.env.KeyPair
            } : undefined
        });*/

        this.updateCluster(this.cluster);
    }

    updateCluster(cluster:Cluster) {
        const moduleOptions = this.props.moduleOptions || {}
        const containers = this.props.containers?.length ? this.props.containers : [""];
        new AccessEntry(this, `${this.id}-access-entry`, {
            cluster,
            accessEntryType: "STANDARD" as any,
            principal: process.env.PARTICIPANT_ASSUMED_ROLE_ARN || this.props.principal || `arn:aws:iam::${Stack.of(this).account}:role/Admin`,
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
                namespace = cluster.addManifest(`${container}-namespace`, {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: container
                    }
                })
            }
            
            const kb = new KubernetesModule(this.props.module, moduleOptions);
            kb.assets.forEach(asset => {
                if (container) asset.metadata.namespace = container;
                if (usedNames.includes(asset.metadata.name)) asset.metadata.name = `${asset.metadata.name}-${asset.kind.toLowerCase()}`
                else usedNames.push(asset.metadata.name);
                const manifest = cluster.addManifest(`${container}-${asset.kind}-${asset.metadata.name}`, asset);
                if (container) manifest.node.addDependency(namespace);
            })
        });  
    }

    getPrefixListId():string {
        const cr = new AwsCustomResource(this, `${this.id}-pl-cr`, {
            onUpdate: {
                service: "EC2",
                action: "describeManagedPrefixLists",
                parameters: {
                    Filters: [
                        {
                            Name: "prefix-list-name",
                            Values: [`com.amazonaws.${Stack.of(this).region}.ec2-instance-connect`]
                        }
                    ]
                },
                physicalResourceId: PhysicalResourceId.fromResponse("PrefixLists.0.PrefixListId")
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: ["*"]
            }),
            installLatestAwsSdk: true
        })

        return cr.getResponseField("PrefixLists.0.PrefixListId");
    }
}