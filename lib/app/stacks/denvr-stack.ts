import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { nginxOverride } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';

// NOTE: Before using this stack you must enable the model in the region you're using in the AWS account
export class OpeaRemoteInferenceStack extends Stack {

  constructor(scope: Construct, id: string, cluster: Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    new ImportedCluster(this, `remote-inference-imported`, {
      moduleName: 'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name: "chatqna-remote-inference",
          namespace: "remote-inference",
          manifestFiles: [
            join(__dirname, "../manifests/denvr.yml"),
            join(__dirname, '../manifests/denvr-ingress.yml')
          ],
          overrides: nginxOverride
        }
      ]
    });
  }
}
