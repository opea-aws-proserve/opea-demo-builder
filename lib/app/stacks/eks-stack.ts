import { DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { OpeaDevelopmentEnvironment } from '../resources/environment';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
    
    new OpeaDevelopmentEnvironment(this, "OpeaDevEnv");

    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      module: 'ChatQnA',
    });
  }
}
