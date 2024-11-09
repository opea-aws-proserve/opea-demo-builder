import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../';
import { Construct } from 'constructs';

export class OpeaInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    new OpeaEksCluster(this, "OpeaEksCluster", {
      module: 'ChatQnA',
      containers: [
        "chatqna",
        "chatqna-guardrails"
      ]
    });
  }
}
