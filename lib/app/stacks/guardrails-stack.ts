import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { defaultOverrides, HuggingFaceToken } from '../constants';
import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { addManifests } from '../../construct/util';
import { ImportedCluster } from '../../construct/resources/imported';

export class OpeaGuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    
    const manifestFiles = [join(__dirname, '../manifests/guardrails-ingress.yml')];
    const imported = new ImportedCluster(this, `guardrails-imported`, cluster);
    if (!HuggingFaceToken) {
      throw new Error('Please add HUGGING_FACE_TOKEN environment variable');
    }
    addManifests('ChatQnA', imported.root, [
      {
        name:"chatqna-guardrails",
        overrides:defaultOverrides,
        namespace: "guardrails",
        manifestFiles
      }
    ]);
  }
}
