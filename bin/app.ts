#!/usr/bin/env node
import 'source-map-support/register';
import { OpeaEksStack } from '../lib/app/eks';
import { App } from 'aws-cdk-lib';

const app = new App();

const stackProps = {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION  || process.env.AWS_REGION || 'us-east-1'
  },

}

new OpeaEksStack(app, 'OpeaEksStack', stackProps);
