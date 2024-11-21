import { DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { OpeaImages } from '../../construct/resources/ecr';
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
      moduleName: 'ChatQnA',
    });
  }
}
