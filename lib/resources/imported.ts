import { Cluster, ICluster, KubectlProvider } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";

export class ImportedCluster extends Construct {
    root:ICluster
    constructor(scope:Construct, id:string, cluster:Cluster) {
        super(scope,id);

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

    }
}