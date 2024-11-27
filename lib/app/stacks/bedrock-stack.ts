import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnPodIdentityAssociation, Cluster, ClusterAttributes } from 'aws-cdk-lib/aws-eks';
import { bedrockOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal, SessionTagsPrincipal } from 'aws-cdk-lib/aws-iam';

// NOTE: Before using this stack you must enable the model in the region you're using in the AWS account
export class OpeaBedrockStack extends Stack {

  constructor(scope: Construct, id: string, cluster:Cluster | ClusterAttributes, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

     // Set up role to allow pod to access Bedrock
     const bedrockPodIdentityRole = new Role(this, 'BedrockPodIdentityRole', {
      assumedBy: new SessionTagsPrincipal(new ServicePrincipal('pods.eks.amazonaws.com')),
      inlinePolicies: {
        InvokeBedrock: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
              ],
              effect: Effect.ALLOW,
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
      moduleName:'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name:"chatqna-bedrock",
        //  namespace:"bedrock",
          manifestFiles: [
            join(__dirname, "../manifests/bedrock.yml"),
        //    join(__dirname, '../manifests/bedrock-ingress.yml')
          ],
          overrides:{
            ...bedrockOverrides,
            "chatqna-bedrock-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: "public.ecr.aws/h5a9b7x0/opeastaging/bedrock"}]
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
