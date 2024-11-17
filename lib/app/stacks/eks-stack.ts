import { CfnOutput, DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
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
    const parameterName = process.env.IS_WORKSHOP === "workshop" ? "workshop-bucket" : "template-bucket";
    new StringParameter(this, "bucket-param", {
      parameterName,
      stringValue: bucket.bucketName
    });
    new StringParameter(this, "command-param", {
      parameterName: 'get-repo-command-args',
      stringValue: `s3://${bucket.bucketName}/opea-workshop-builder.zip ./opea-workshop-builder.zip`
    });
    // get repo command `aws s3 sync $(aws ssm get-parameter --name get-repo-command-args --query Parameter.Value --output text)`
    new CfnOutput(this, "bucket-output", {
      exportName: "get-repo-command",
      value: `aws s3 cp s3://${bucket.bucketName}/opea-workshop-builder.zip ./opea-workshop-builder.zip`
    })
    
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      moduleName: 'ChatQnA',
    });
  }
}
