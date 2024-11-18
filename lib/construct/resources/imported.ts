import { Cluster, ICluster, KubectlProvider, KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { KubernetesModuleContainer, OpeaManifestProps } from "../util/types";
import { KubernetesModule } from "../modules/kubernetes-module";

export class ImportedCluster extends Construct {
    root:ICluster
    kubernetesModules: KubernetesModule[] = [];

    constructor(
        scope:Construct, 
        id:string, 
        protected props:OpeaManifestProps
    ) {
        super(scope,id);
        const cluster = props.cluster;
        const kubectlProvider = KubectlProvider.getOrCreate(this, cluster);

        this.root = Cluster.fromClusterAttributes(this, `${id}-imported-cluster`, {
            clusterName: cluster.clusterName,
            kubectlRoleArn:cluster.kubectlRole?.roleArn,
            kubectlProvider,
            vpc:cluster.vpc,
            clusterEndpoint:cluster.clusterEndpoint,
            kubectlLambdaRole:cluster.kubectlLambdaRole,
            kubectlEnvironment:cluster.kubectlEnvironment,
            openIdConnectProvider:cluster.openIdConnectProvider,
            kubectlLayer:cluster.kubectlLayer,
            awscliLayer:cluster.awscliLayer,
            onEventLayer:cluster.onEventLayer
        });
        this.addManifests();
    }

    get containers(): KubernetesModuleContainer[] {
        return this.props.containers || [];
    }

    protected addManifests() {
        if (this.props.manifestFiles || this.props.manifests) {
            const genericContainer = {
                namespace: this.props.namespace,
                manifests:this.props.manifests,
                manifestFiles:this.props.manifestFiles
            }
            if (!this.props.containers) this.props.containers = [];
            this.props.containers.push(genericContainer);
        }
        this.containers.forEach(container => {
            const cluster = this.root;
            const usedNames:string[] = [];
            let namespace:KubernetesManifest;
            if (container.namespace) {
                namespace = cluster.addManifest(`${container.name}-namespace`, {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: container.namespace
                    }
                })
            }
            
            const kb = new KubernetesModule(this.props.moduleName, {
                container,
                ...({skipPackagedManifests:this.props.skipPackagedManifests})
            });
            this.kubernetesModules.push(kb);
            kb.assets.forEach(asset => {
                asset.metadata.namespace = container.namespace || 'default';
                if (usedNames.includes(asset.metadata.name)) asset.metadata.name = `${asset.metadata.name}-${asset.kind.toLowerCase()}`
                else usedNames.push(asset.metadata.name);
                const manifest = cluster.addManifest(`${container.name}-${asset.kind}-${asset.metadata.name}`, asset);
                if (namespace) manifest.node.addDependency(namespace);
            })
        });  
    }

}