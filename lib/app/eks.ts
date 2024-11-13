import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../resources/cluster';
import { Construct } from 'constructs';
import { defaultOverrides } from '../constants';

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
      defaultNamespace: "chatqna",
      containers: [
        {
          name:"chatqna",
          overrides: defaultOverrides
        },
        {
          name:"chatqna-guardrails",
          overrides:defaultOverrides,
          namespace: "guardrails"
        }
      ]
    });
  }
}
