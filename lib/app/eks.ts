import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../resources/cluster';
import { Construct } from 'constructs';

export class OpeaEksStack extends Stack {
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
