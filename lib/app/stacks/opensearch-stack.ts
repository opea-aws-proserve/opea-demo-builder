import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { defaultOverrides } from '../constants';
//import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { join } from 'path';
//import { addManifests } from '../../construct/util';
//import { ImportedCluster } from '../resources/imported';

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
    new ImportedCluster(this, `opensearch-imported`, {
      moduleName:'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name:"chatqna-opensearch",
          namespace:"opensearch",
          manifestFiles: [
            join(__dirname, "../../../assets/opensearch.yml"),
            join(__dirname, '../manifests/opensearch-ingress.yml')
          ],
          helmChart: {
            asset: new Asset(this, `${id}-asset`, {
              path: join(__dirname, '../manifests/chart')
            })
          },
          overrides:{
            ...opensearchOverrides,
            "chatqna-data-prep-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: `${stack.account}.dkr.ecr.${stack.region}.amazonaws.com/dataprep-opensearch`}]
                  }
                }
              }
            },
            "chatqna-retriever-usvc-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: `${stack.account}.dkr.ecr.${stack.region}.amazonaws.com/retriever-opensearch-server`}]
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
