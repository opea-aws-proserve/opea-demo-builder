import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { bedrockOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { join } from 'path';

export class OpeaOpensearchStack extends Stack {

  constructor(scope: Construct, id: string, cluster:Cluster, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    const importedCluster = new ImportedCluster(this, `opensearch-imported`, {
      moduleName:'ChatQnA',
      cluster,
      skipPackagedManifests: true,
      containers: [
        {
          name:"chatqna-bedrock",
          namespace:"bedrock",
          manifestFiles: [
            join(__dirname, "../manifests/bedrock.yml"),
            join(__dirname, '../manifests/bedrock-ingress.yml')
          ],
          overrides:{
            ...bedrockOverrides,
            "chatqna-bedrock-kind-deployment": {
              spec: {
                template: {
                  spec: {
                    containers: [{image: Fn.importValue("bedrock-image-uri")}]
                  }
                }
              }
            }
          }
        }
      ]
    });
  }
}
