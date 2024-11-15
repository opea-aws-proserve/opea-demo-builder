import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { defaultOverrides } from '../constants';
import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { addManifests } from '../util';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ImportedCluster } from '../resources/imported';

export class OpeaGuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    
    const manifestFiles = [join(__dirname, 'manifests/guardrails-ingress.yml')];
    const imported = new ImportedCluster(this, `guardrails-imported`, cluster);

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
