// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface OpeaDemoBuilderProps {
  // Define construct properties here
}

export class OpeaDemoBuilder extends Construct {

  constructor(scope: Construct, id: string, props: OpeaDemoBuilderProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'OpeaDemoBuilderQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
