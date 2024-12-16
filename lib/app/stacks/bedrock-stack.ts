import { BootstraplessSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster, CfnPodIdentityAssociation } from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { bedrockOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';


// NOTE: Before using this stack you must enable the model in the region you're using in the AWS account
export class OpeaBedrockStack extends Stack {

  constructor(scope: Construct, id: string, cluster: Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new BootstraplessSynthesizer()
    });

    // Set up role to allow pod to access Bedrock
    const bedrockPodIdentityRole = new iam.Role(this, 'BedrockPodIdentityRole', {
      assumedBy: new iam.SessionTagsPrincipal(new iam.ServicePrincipal('pods.eks.amazonaws.com')),
      inlinePolicies: {
        InvokeBedrock: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
              ],
              effect: iam.Effect.ALLOW,
              resources: ["*"],
            })
          ]
        })
      }
    });

    // Set up pod identity association to allow Bedrock pod to use the role
    const bedrockPodIdentityAssociation = new CfnPodIdentityAssociation(this, 'BedrockPodIdentity', {
      clusterName: cluster.clusterName,
      namespace: 'bedrock',
      roleArn: bedrockPodIdentityRole.roleArn,
      serviceAccount: 'chatqna-bedrock-sa'
    });

    const importedCluster = new ImportedCluster(this, `bedrock-imported`, {
      moduleName: 'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name: "chatqna-bedrock",
          namespace: "bedrock",
          manifestFiles: [
            join(__dirname, "../manifests/bedrock.yml"),
            join(__dirname, '../manifests/bedrock-ingress.yml')
          ],
          overrides: {
            ...bedrockOverrides,
            "chatqna-bedrock-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{ image: "public.ecr.aws/h5a9b7x0/opeastaging/bedrock" }]
                  }
                }
              }
            }
          }
        }
      ]
    });

    importedCluster.node.addDependency(bedrockPodIdentityAssociation);
  }
}
