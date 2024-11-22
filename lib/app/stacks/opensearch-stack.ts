import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { join } from 'path';

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
            join(__dirname, "../manifests/opensearch-all.yml"),
            join(__dirname, '../manifests/opensearch-ingress.yml')
          ],
        /*  helmChart: {
            asset: new Asset(this, `${id}-asset`, {
              path: join(__dirname, '../manifests/chart')
            })
          },*/
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
}
