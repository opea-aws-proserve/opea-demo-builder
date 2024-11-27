#!/usr/bin/env node
import 'source-map-support/register';
import { OpeaEksStack } from '../lib/app/stacks/eks-stack';
import { App } from 'aws-cdk-lib';
import { OpeaGuardrailsStack } from '../lib/app/stacks/guardrails-stack';
import { OpeaChatQnAStack } from '../lib/app/stacks/chatqna-stack';
import { OpeaOpensearchStack } from '../lib/app/stacks/opensearch-stack';
import { OpeaBedrockStack } from '../lib/app/stacks/bedrock-stack';
import { OpeaDenvrStack } from '../lib/app/stacks/denvr-stack';

const app = new App();

const stackProps = {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION  || process.env.AWS_REGION || 'us-east-1'
  },
}

const eks = new OpeaEksStack(app, 'OpeaEksStack', stackProps);

const chat = new OpeaChatQnAStack(app, 'OpeaChatQnAStack', eks.root.cluster, stackProps);
const guardrails = new OpeaGuardrailsStack(app, 'OpeaGuardrailsStack', eks.root.cluster, stackProps);
const opensearch = new OpeaOpensearchStack(app, 'OpeaOpensearchStack', eks.root.cluster, stackProps);
const bedrock = new OpeaBedrockStack(app, "OpeaBedrockStack", eks.root.cluster, stackProps);
const denvr = new OpeaDenvrStack(app, "OpeaDenvrStack", eks.root.cluster, stackProps);

chat.addDependency(eks);
guardrails.addDependency(eks);
opensearch.addDependency(eks);
bedrock.addDependency(eks);
denvr.addDependency(eks);