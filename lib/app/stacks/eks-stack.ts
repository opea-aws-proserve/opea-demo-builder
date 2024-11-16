import { DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    const bucket = new Bucket(this, "bucket");

    new StringParameter(this, "bucket-param", {
      parameterName: 'workshop-bucket',
      stringValue: bucket.bucketName
    });
    
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      module: 'ChatQnA',
    });
  }
}
