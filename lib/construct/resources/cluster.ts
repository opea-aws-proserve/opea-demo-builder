import { AccessEntry, AccessPolicyArn, AccessScopeType, AlbControllerVersion, AuthenticationMode, Cluster, DefaultCapacityType, EndpointAccess, ICluster, KubernetesManifest, KubernetesVersion, NodegroupAmiType } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { getClusterLogLevel } from "../util";
import { AwsCliLayer } from "aws-cdk-lib/lambda-layer-awscli";
import { FlowLogDestination, InstanceClass, InstanceSize, InstanceType, IVpc, KeyPair, Peer, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import * as Constants from '../constants.json';
import { Size, Stack } from "aws-cdk-lib";
import { KubernetesModuleContainer, OpeaEksProps } from "../util/types";
import { NodeProxyAgentLayer } from "aws-cdk-lib/lambda-layer-node-proxy-agent";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { KubernetesModule } from "../modules/kubernetes-module";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

export class OpeaEksCluster extends Construct {
    cluster: Cluster;
    kubernetesModules: KubernetesModule[] = [];
    vpc:IVpc;
    securityGroup: SecurityGroup
    module:string

    readonly intelXeonClasses: (keyof typeof InstanceClass)[] = Constants.intelXeonClasses as (keyof typeof InstanceClass)[]

    constructor(
        scope: Construct, 
        public id: string, 
        public props: OpeaEksProps
    ) {
        super(scope, id);
        this.vpc = props.vpc ? props.vpc : new Vpc(this, "OpeaVpc", {
            subnetConfiguration: [
                {
                    name: 'publicSubnet',
                    subnetType: SubnetType.PUBLIC,
                },
            ],   
            flowLogs: {
                BriefingFlowLogs: {
                    destination: FlowLogDestination.toCloudWatchLogs()
                }
            },
        // availabilityZones: Fn.getAzs(Stack.of(this).region)
        })
        if (props.securityGroup) this.securityGroup = props.securityGroup;
        else {
            this.securityGroup = new SecurityGroup(this, `${id}-sg1`, { 
                vpc:this.vpc,
                allowAllOutbound:true,
                securityGroupName:`${id}-sg1`
            });
        }
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(7000))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(8001))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(8888))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5173))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(6379))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(6007))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2021))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2080))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2081))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2082))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(2083))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9000))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9090))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9200))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9300))
        this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9600))
        this.securityGroup.connections.allowFrom(Peer.prefixList(this.getPrefixListId()), Port.allTcp());

        const instanceType = props.instanceType || InstanceType.of(InstanceClass.M7I, InstanceSize.XLARGE24);
        const keyPair = process.env.EC2_SSH_KEYPAIR || (new KeyPair(this, `${id}-keypair`)).keyPairName;
        
        this.cluster = new Cluster(this, `opea-eks-cluster`, {            
            kubectlLayer: new KubectlV31Layer(this, `${id}-kubectl-layer`),
            awscliLayer: new AwsCliLayer(this, `${id}-awscli-layer`),
            onEventLayer: new NodeProxyAgentLayer(this, `${id}-node-proxy-agent-layer`),
            vpc: this.vpc,
            albController: {
                version: AlbControllerVersion.V2_8_2
            },
            defaultCapacityType: DefaultCapacityType.EC2,
            defaultCapacityInstance: instanceType,
            defaultCapacity: 0,
            kubectlMemory: Size.mebibytes(4096),
            endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
            ...(props?.clusterProps || {}),
            vpcSubnets: props.subnets?.length ? props.subnets : props.clusterProps?.vpcSubnets?.length ? props.clusterProps.vpcSubnets : [{subnetType:SubnetType.PUBLIC}],
            securityGroup: this.securityGroup,
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
            diskSize: props.nodeGroupDiskSize || 500,
            nodegroupName: `${id}-node-group`,
            remoteAccess: props.skipKeyPair ? undefined : {
                sshKeyName: keyPair,
                sourceSecurityGroups: [this.securityGroup]
            }
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
        return !!(this.props.defaultNamespace && this.props.defaultNamespace.toLowerCase() === (container.name || 'default').toLowerCase());
    }

    getNamespaceName(container:KubernetesModuleContainer): string {
        if (this.isDefaultNamespace(container)) return 'default';
        return container.namespace || container.name || 'default';
    }

    addManifests(...containers:KubernetesModuleContainer[]) {
        containers.forEach(container => {
            const usedNames:string[] = [];
            let namespace:KubernetesManifest;
            const useDefaultNamespace = this.isDefaultNamespace(container);
            if (!this.isDefaultNamespace(container) && !process.env.SKIP_NAMESPACE) {
                namespace = this.cluster.addManifest(`${container.name}-namespace`, {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: container.namespace || container.name || 'default'
                    }
                })
            }
            this.module = this.props.moduleName;
            const kb = new KubernetesModule(this.props.moduleName, {
                container,
                ...(this.props.moduleOptions || {}),
                skipPackagedManifests: this.props.skipPackagedManifests
            });
            this.kubernetesModules.push(kb);
            kb.assets.forEach(asset => {
                asset.metadata.namespace = this.getNamespaceName(container);
                if (usedNames.includes(asset.metadata.name)) asset.metadata.name = `${asset.metadata.name}-${asset.kind.toLowerCase()}`
                else usedNames.push(asset.metadata.name);
                const manifest = this.cluster.addManifest(`${container.name}-${asset.kind}-${asset.metadata.name}`, asset);
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
                        if (!this.isDefaultNamespace(a)) acc.push(a.namespace || a.name || 'default');
                        return acc;
                    }, ["default"] as string[]),
                },
                policy: AccessPolicyArn.AMAZON_EKS_ADMIN_POLICY.policyArn
            }
        ]

        const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN;
        const addlPrincipals = process.env.OPEA_ROLE_ARN || "";
        const roleNames = process.env.OPEA_ROLE_NAME || "";
        const users = process.env.OPEA_USER || "";
        let principals = addlPrincipals.split(',').map(a => a.trim());
        if (!principals[0])principals = [];
        if (roleNames) principals.push(...(roleNames.split(",").map(b => `arn:aws:iam::${Stack.of(this).account}:role/${b.trim()}`)));
        if (users) principals.push(...(users.split(",").map(c => `arn:aws:iam::${Stack.of(this).account}:user/${c.trim()}`)));

        if (AWS_ROLE_ARN) principals.unshift(AWS_ROLE_ARN);
        if (!principals.length) throw new Error("Need at least one principal to access cluster. Set OPEA_ROLE_NAME or OPEA_USER environment variable.")
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