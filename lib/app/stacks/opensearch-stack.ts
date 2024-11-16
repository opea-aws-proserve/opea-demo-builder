import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { defaultOverrides } from '../constants';
//import { join } from 'path';
import { Cluster } from 'aws-cdk-lib/aws-eks';
//import { addManifests } from '../../construct/util';
//import { ImportedCluster } from '../resources/imported';

export class OpeaOpensearchStack extends Stack {
  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });
  }
}
