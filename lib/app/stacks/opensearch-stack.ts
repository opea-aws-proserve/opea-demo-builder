import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { defaultOverrides } from '../constants';
//import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
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
    new ImportedCluster(this, `opensearch-imported`, {
      moduleName:'ChatQnA',
      cluster,
      containers: [
        {
          name:"chatqna-opensearch",
          overrides:opensearchOverrides,
          helmChart: {
            chart: {
              name: "opensearch",
              repo: "https://opensearch-project.github.io/helm-charts/"
            }
          },
          namespace:"opensearch",
        }
      ]
    });
    
  }
}
