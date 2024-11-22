import { DefaultStackSynthesizer, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { HuggingFaceToken, opensearchOverrides } from '../constants';
import { ImportedCluster } from '../../construct/resources/imported';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { join } from 'path';
import { OpeaImages } from '../../construct/resources/ecr';

export class OpeaImageStack extends Stack {
  images:OpeaImages

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
      })
    });

    this.images = new OpeaImages(this, "OpeaImages", {
      directory: join(__dirname, "../../../assets/genai-comps"),
      dataprepPath: "comps/dataprep/opensearch/langchain/Dockerfile",
      retrieverPath: "comps/retrievers/opensearch/langchain/Dockerfile",
      bedrockPath: "comps/llms/text-generation/bedrock/Dockerfile"
    });
  }
}
