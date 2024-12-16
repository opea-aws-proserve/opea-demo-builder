import { BootstraplessSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { guardrailOverrides, HuggingFaceToken } from '../constants';
import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { ImportedCluster } from '../../construct/resources/imported';

export class OpeaGuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new BootstraplessSynthesizer()
    });
    
    if (!HuggingFaceToken) {
      throw new Error('Please add HUGGING_FACE_TOKEN environment variable');
    }
    const manifestFiles = [join(__dirname, '../manifests/guardrails-ingress.yml')];

    new ImportedCluster(this, `guardrails-imported`, {
      moduleName:'ChatQnA',
      cluster,
      containers: [
        {
          name:"chatqna-guardrails",
          overrides:guardrailOverrides,
          manifestFiles,
          namespace:"guardrails"
        }
      ]
    });
  }
}
