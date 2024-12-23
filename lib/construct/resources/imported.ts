import { Cluster, ICluster, KubectlProvider, KubernetesManifest } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import { KubernetesModuleContainer, OpeaManifestProps } from "../util/types";
import { KubernetesModule } from "../modules/kubernetes-module";

export class ImportedCluster extends Construct {
    root:ICluster
    kubernetesModules: KubernetesModule[] = [];

    constructor(
        scope:Construct, 
        protected id:string, 
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
        if (this.hasHelmCharts) this.addHelmCharts();
        if (this.hasManifests) this.addManifests();
    }

    get containers(): KubernetesModuleContainer[] {
        return this.props.containers || [];
    }

    get hasManifests():boolean {
        return !!(this.props.manifestFiles || this.props.manifests ||
            (this.containers || []).some(a => (a.manifestFiles || a.manifests))
        ); 
    }

    get hasHelmCharts():boolean {
        return !!(this.props.helmChart?.chart?.name || this.props.helmChart?.asset ||
            (this.containers || []).some(a => (a.helmChart?.chart?.name || a.helmChart?.asset))
        ); 
    }

    addManifests(id:string = "") {
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
                namespace = cluster.addManifest(`${container.name}-namespace${id}`, {
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
                const manifest = cluster.addManifest(`${container.name}-${asset.kind}-${asset.metadata.name}${id}`, asset);
                if (namespace) manifest.node.addDependency(namespace);
            })
        });  
    }

    addHelmCharts(id:string = "") {
        if (this.props.helmChart) {
            const genericContainer = {
                namespace: this.props.namespace || 'default',
                chart: this.props.helmChart?.chart?.name,
                chartAsset: this.props.helmChart?.asset,
                repository: this.props.helmChart?.chart?.repo,
                ...(this.props.helmChart?.options || {})
            }
            if (!this.props.containers) this.props.containers = [];
            this.props.containers.push(genericContainer);
        }
        this.containers.forEach(container => {
            this.root.addHelmChart(`${this.id}-helm${id}`, {
                chart: container.helmChart?.chart?.name,
                chartAsset: container.helmChart?.asset,
                repository: container.helmChart?.chart?.repo,
                ...(container.helmChart?.options || {})
            })
        })
    }

}