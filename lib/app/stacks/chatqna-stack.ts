import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { chatOverrides, HuggingFaceToken } from '../constants';
import { join } from 'path';
import { Cluster, ClusterAttributes } from 'aws-cdk-lib/aws-eks';
import { ImportedCluster } from '../../construct/resources/imported';

export class OpeaChatQnAStack extends Stack {
  constructor(scope: Construct, id: string, cluster:Cluster | ClusterAttributes, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    if (!HuggingFaceToken) {
      throw new Error('Please add HUGGING_FACE_TOKEN environment variable');
    }
    const manifestFiles = [join(__dirname, '../manifests/chatqna-ingress.yml')];
    new ImportedCluster(this, `chatqna-imported`, {
      moduleName:'ChatQnA',
      cluster,
      containers: [
        {
          name:"chatqna",
          overrides:chatOverrides,
          manifestFiles
        }
      ]
    });

  }
}
