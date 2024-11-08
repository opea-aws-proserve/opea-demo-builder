#!/usr/bin/env node
import 'source-map-support/register';
import { OpeaInfraStack } from '../lib/app/opea-infra-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new OpeaInfraStack(app, 'UtilStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION  || process.env.AWS_REGION || 'us-east-1'
  },

});