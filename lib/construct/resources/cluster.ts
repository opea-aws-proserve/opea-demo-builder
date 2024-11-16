import { AccessEntry, AccessPolicyArn, AccessScopeType, AlbControllerVersion, AuthenticationMode, Cluster, DefaultCapacityType, EndpointAccess, ICluster, KubernetesManifest, KubernetesVersion, NodegroupAmiType } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getClusterLogLevel } from "../util";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { FlowLogDestination, InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import * as Constants from '../constants.json';
import { Size, Stack } from "aws-cdk-lib";
import { KubernetesModuleContainer, OpeaEksProps } from "../util/types";
import { NodeProxyAgentLayer } from "aws-cdk-lib/lambda-layer-node-proxy-agent";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { KubernetesModule } from "../modules/kubernetes-module";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    vpc:Vpc;
    securityGroup: SecurityGroup
    module:string

    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]

    constructor(
        scope: Construct, 
        public id: string, 
        public props: OpeaEksProps
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
        sg1.addIngressRule(Peer.anyIpv4(), Port.tcp(22))
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

        sg1.connections.allowFrom(Peer.prefixList(this.getPrefixListId()), Port.tcp(22));
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
            defaultCapacity: 0,
            kubectlMemory: Size.mebibytes(4096),
            endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
            ...(props?.clusterProps || {}),
            version: KubernetesVersion.V1_31,
            clusterHandlerEnvironment: {
                ...(props?.environmentVariables || {}), 
                ...(props?.clusterProps?.clusterHandlerEnvironment || {})
            },
            clusterLogging: getClusterLogLevel(props?.logLevel, props?.clusterProps?.clusterLogging),
            clusterName: `opea-eks-cluster`,
            kubectlEnvironment: {
                ...(props?.environmentVariables || {}),
                ...(props?.clusterProps?.kubectlEnvironment || {})
            },
            authenticationMode: AuthenticationMode.API_AND_CONFIG_MAP
        });
        
        this.cluster.addNodegroupCapacity(`${id}-node-group`, {
            instanceTypes: [instanceType, ...(props.additionalInstanceTypes || [])],
            desiredSize: 1,
            maxSize: 1,
            amiType: NodegroupAmiType.AL2023_X86_64_STANDARD,
            diskSize: props.nodeGroupDiskSize || 100,
            nodegroupName: `${id}-nodegroup`,
            remoteAccess: process.env.EC2_SSH_KEYPAIR ? {
                sshKeyName: process.env.EC2_SSH_KEYPAIR,
                sourceSecurityGroups: [this.securityGroup]
            } : undefined
        });
        this.addAccessEntry(this.cluster);
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

    isDefaultNamespace(container:KubernetesModuleContainer):boolean {
        return !!(this.props.defaultNamespace && this.props.defaultNamespace.toLowerCase() === container.name.toLowerCase());
    }

    getNamespaceName(container:KubernetesModuleContainer): string {
        if (this.isDefaultNamespace(container)) return 'default';
        return container.namespace || container.name;
    }

    addManifests(cluster:ICluster, ...containers:KubernetesModuleContainer[]) {
        containers.forEach(container => {
            const usedNames:string[] = [];
            let namespace:KubernetesManifest;
            const useDefaultNamespace = this.isDefaultNamespace(container);
            if (!this.isDefaultNamespace(container)) {
                namespace = cluster.addManifest(`${container.name}-namespace`, {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: container.namespace || container.name
                    }
                })
            }
            this.module = this.props.module;
            const kb = new KubernetesModule(this.props.module, {
                container,
                ...(this.props.moduleOptions || {})
            });

            kb.assets.forEach(asset => {
                asset.metadata.namespace = this.getNamespaceName(container);
                if (usedNames.includes(asset.metadata.name)) asset.metadata.name = `${asset.metadata.name}-${asset.kind.toLowerCase()}`
                else usedNames.push(asset.metadata.name);
                const manifest = cluster.addManifest(`${container.name}-${asset.kind}-${asset.metadata.name}`, asset);
                if (!useDefaultNamespace) manifest.node.addDependency(namespace);
            })
        });  
    }

    addAccessEntry(cluster:ICluster) {
        const containers = this.props.containers?.length ? this.props.containers : [];
        const accessPolicies = [
            {
                accessScope: {
                    type: AccessScopeType.CLUSTER
                },
                policy: AccessPolicyArn.AMAZON_EKS_CLUSTER_ADMIN_POLICY.policyArn
            },
            {
                accessScope: {
                    type: AccessScopeType.NAMESPACE,
                    namespaces: containers.reduce((acc,a) => {
                        if (!this.isDefaultNamespace(a)) acc.push(a.namespace || a.name);
                        return acc;
                    }, ["default"] as string[]),
                },
                policy: AccessPolicyArn.AMAZON_EKS_ADMIN_POLICY.policyArn
            }
        ]

        const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN;
        const addlPrincipals = process.env.OPEA_ROLE_ARN || "";
        const roleNames = process.env.OPEA_ROLE_NAME || "";
        const users = process.env.OPEA_USERS || "";
        let principals = addlPrincipals.split(',').map(a => a.trim());
        if (!principals[0])principals = [];
        if (roleNames) principals.push(...(roleNames.split(",").map(b => `arn:aws:iam::${Stack.of(this).account}:role/${b.trim()}`)));
        if (users) principals.push(...(users.split(",").map(c => `arn:aws:iam::${Stack.of(this).account}:user/${c.trim()}`)));

        if (AWS_ROLE_ARN) principals.unshift(AWS_ROLE_ARN);
        if (!principals.length) throw new Error("Need at least one principal to access cluster. Set OPEA_ROLE_NAME or OPEA_USERS environment variable.")
        principals.forEach((principal,index) => {
            new AccessEntry(this, `${this.id}-access-entry-${index}`, {
                cluster,
                accessEntryType: "STANDARD" as any,
                principal,
                accessPolicies
            });
        });
    }
}