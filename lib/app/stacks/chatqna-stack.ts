import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { defaultOverrides, HuggingFaceToken } from '../constants';
import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { addManifests } from '../../construct/util';
import { ImportedCluster } from '../../construct/resources/imported';

export class OpeaChatQnAStack extends Stack {
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
    const manifestFiles = [join(__dirname, '../manifests/chatqna-ingress.yml')];
    const imported = new ImportedCluster(this, `chatqna-imported`, cluster);
    addManifests('ChatQnA', imported.root, [
      {
        name:"chatqna",
        overrides:defaultOverrides,
        manifestFiles
      }
    ]);
  }
}