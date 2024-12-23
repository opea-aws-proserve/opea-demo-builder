import { CfnParameter, DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, nginxOverride } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';

// NOTE: Before using this stack you must enable the model in the region you're using in the AWS account
export class OpeaRemoteInferenceStack extends Stack {

  constructor(scope: Construct, id: string, cluster: Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
//        generateBootstrapVersionRule: false      
      })
    });

    const clientId = new CfnParameter(this, 'RemoteInferenceClientId', {
      type: 'String',
      description: "If you have an \"Inference API\" account, put your client id here to integrate it with your Opea Cluster. If you don't have a Remote Inference account, leave this blank.",
      default: ""
    })

    const clientSecret = new CfnParameter(this, 'RemoteInferenceClientSecret', {
      type: 'String',
      description: "If you have an \"Inference API\" account, put your client secret here to integrate it with your Opea Cluster. If you don't have a Remote Inference account, leave this blank.",
      default: ""
    })

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
          overrides: {
              ...nginxOverride,
              "chatqna-retriever-usvc-config": {
                  "data": {
                      "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
                  }
              },
              "chatqna-data-prep-config": {
                  "data": {
                      "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken
                  }
              },
              "chatqna-llm-uservice-config": {
                  "data": {
                      "HUGGINGFACEHUB_API_TOKEN": HuggingFaceToken,
                      "CLIENTID": clientId.valueAsString || process.env.REMOTE_INFERENCE_CLIENT_ID,
                      "CLIENT_SECRET": clientSecret.valueAsString || process.env.REMOTE_INFERENCE_CLIENT_SECRET
                  }
              }
          }
        }
      ]
    });
  }
}
