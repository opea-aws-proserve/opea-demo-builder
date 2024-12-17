import { BootstraplessSynthesizer,  Stack, StackProps } from 'aws-cdk-lib';
import { OpeaEksCluster } from '../../construct/resources/cluster';
import { Construct } from 'constructs';
import { InstanceType } from 'aws-cdk-lib/aws-ec2';

export class OpeaEksStack extends Stack {
  root:OpeaEksCluster;

  constructor(scope: Construct, id: string, props?: StackProps & {
    instanceType?: string
    diskSize?:string
  }) {
    super(scope, id, {
      ...props,
      synthesizer: new BootstraplessSynthesizer()
    });
    
    this.root = new OpeaEksCluster(this, "OpeaEksCluster", {
      moduleName: 'ChatQnA',
      instanceType: props?.instanceType ? new InstanceType(props.instanceType) : undefined,
      nodeGroupDiskSize: props?.diskSize && !(isNaN(Number(props.diskSize))) ? Number(props.diskSize) : undefined
    });
  }
}
