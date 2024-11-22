import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Addon, CfnAddon, Cluster, ICluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';
import { ManagedPolicy, Role, ServicePrincipal, SessionTagsPrincipal } from 'aws-cdk-lib/aws-iam';

export class OpeaOpensearchStack extends Stack {

  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    if (!HuggingFaceToken) {
      throw new Error('Please add HUGGING_FACE_TOKEN environment variable');
    }
    // this.setupEBSCSIPodIdentity(cluster);
    const stack = Stack.of(this); 
    const importedCluster = new ImportedCluster(this, `opensearch-imported`, {
      moduleName:'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name:"chatqna-opensearch",
          namespace:"opensearch",
          manifestFiles: [
            join(__dirname, "../manifests/opensearch.yml"),
            join(__dirname, '../manifests/opensearch-ingress.yml')
          ],
          helmChart: {
            chart: {
              name: 'opensearch',
              repo: 'https://opensearch-project.github.io/helm-charts/',
            },
            options: {
              version: "2.25.0",
              namespace: "opensearch",
              createNamespace: true,
              values: {
                extraEnvs: [
                  {
                    name: "OPENSEARCH_INITIAL_ADMIN_PASSWORD",
                    value: "strongOpea0!"
                  }
                ],
                persistence: {
                  enabled: false,
                  size: "25Gi"
                },
                singleNode: true
              }
            }
          },
          overrides:{
            ...opensearchOverrides,
            "chatqna-data-prep-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: "976193265124.dkr.ecr.us-east-1.amazonaws.com/opea/dataprep-opensearch"}]
                  }
                }
              }
            },
            "chatqna-retriever-usvc-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: "976193265124.dkr.ecr.us-east-1.amazonaws.com/opea/retriever-opensearch-server"}]
                  }
                }
              }
            }
          }
        }
      ]
    });
  }

  setupEBSCSIPodIdentity(cluster: ICluster) {
    // Ensure that the Pod Identity Agent is installed
    const podIdentityAgentAddon = new Addon(this, 'PodIdentityAddon', {
      addonName: 'eks-pod-identity-agent',
      cluster: cluster,
      preserveOnDelete: false
    });

    // Create the IAM Role to associate with the pod identity
    const ebsCsiRole = new Role(this, 'EBSCSIRole', {
      // assumedBy: new iam.ServicePrincipal('pods.eks.amazonaws.com'),
      assumedBy: new SessionTagsPrincipal(new ServicePrincipal('pods.eks.amazonaws.com')),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonEBSCSIDriverPolicy")
      ]
    });

    // Create the EBS CSI addon, and use pod identity to associate the 
    // CSI service account with the IAM role
    const ebsAddon = new Addon(this, 'EBSAddon', {
      addonName: "aws-ebs-csi-driver",
      cluster: cluster,
      preserveOnDelete: false,
    });
    const cfnEbsAddon = ebsAddon.node.defaultChild as CfnAddon;
    cfnEbsAddon.podIdentityAssociations = [
      {
        roleArn: ebsCsiRole.roleArn,
        serviceAccount: 'ebs-csi-controller-sa'
      }
    ]
  }
}
