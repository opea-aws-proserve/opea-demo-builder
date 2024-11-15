import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../resources/cluster';
import { Construct } from 'constructs';
import { join } from 'path';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      module: 'ChatQnA',
    });
  }
}
