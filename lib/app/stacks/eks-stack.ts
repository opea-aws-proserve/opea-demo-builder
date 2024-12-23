import { CfnOutput, DefaultStackSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { OpeaWorkshopPolicy } from '../../construct/resources/policy';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
//        generateBootstrapVersionRule: false      
      })
    });
    
    const policy = new OpeaWorkshopPolicy(this, "OpeaWorkshopPolicy");
    new CfnOutput(this, "OpeaWorkshopPolicyArn", {
      value: policy.root.managedPolicyArn,
      exportName: "OpeaWorkshopPolicyArn",
      description: "Use this ARN to attach the Opea workshop managed policy to your user or assumed role in order to perform console actions for the Opea workshop.",
    });
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      moduleName: 'ChatQnA',
    });
  }
}
