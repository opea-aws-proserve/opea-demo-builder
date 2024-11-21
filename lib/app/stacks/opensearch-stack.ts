import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { join } from 'path';
import { OpeaImages } from '../../construct/resources/ecr';

export class OpeaOpensearchStack extends Stack {
  images:OpeaImages

  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    process.env.PYTHONPATH = join("assets", "genai-comps");
    if (!HuggingFaceToken) {
      throw new Error('Please add HUGGING_FACE_TOKEN environment variable');
    }

    this.images = new OpeaImages(this, "OpeaImages", {
      dataprepPath: join(__dirname, "../../../assets/genai-comps/comps/dataprep/opensearch/langchain"),
      retrieverPath: join(__dirname, "../../../assets/genai-comps/comps/retrievers/opensearch/langchain")
    });

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
    importedCluster.node.addDependency(this.images);
  }
}
