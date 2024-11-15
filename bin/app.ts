#!/usr/bin/env node
import 'source-map-support/register';
import { OpeaEksStack } from '../lib/app/eks-stack';
import { App } from 'aws-cdk-lib';
import { OpeaGuardrailsStack } from '../lib/app/guardrails-stack';
import { OpeaChatQnAStack } from '../lib/app/chatqna-stack';

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
chat.addDependency(eks);
guardrails.addDependency(eks);