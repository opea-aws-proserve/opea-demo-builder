import { DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { OpeaImages } from '../../construct/resources/ecr';
import { join } from 'path';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;
  images: OpeaImages

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    this.images = new OpeaImages(this, "OpeaImages", {
      dataprepPath: join(__dirname, "../manifests/data-prep"),
      retrieverPath: join(__dirname, "../manifests/retriever")
    });
    
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      moduleName: 'ChatQnA',
    });
  }
}
