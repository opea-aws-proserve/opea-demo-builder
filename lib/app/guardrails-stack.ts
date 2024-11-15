import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { defaultOverrides } from '../constants';
import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { addManifests } from '../util';
import { IRole } from 'aws-cdk-lib/aws-iam';

export class OpeaGuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, kubectlRole:IRole, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    
    const cluster = Cluster.fromClusterAttributes(this, 'opea-guardrails-cluster', {
      clusterName: `opea-eks-cluster`,
      kubectlRoleArn: kubectlRole.roleArn
    });
    const manifestFiles = [join(__dirname, 'manifests/chatqna-ingress.yml')];

    addManifests('ChatQnA', cluster, [
      {
        name:"chatqna-guardrails",
        overrides:defaultOverrides,
        namespace: "guardrails",
        manifestFiles
      }
    ]);
  }
}
