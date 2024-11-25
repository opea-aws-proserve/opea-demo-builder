#!/usr/bin/env node
import { App, Stack } from 'aws-cdk-lib';
import { CliArgArgs, CliArgFlags } from "../cli-args";
import { OpeaEksStack } from '../../stacks/eks-stack';
import { getCluster } from './env';
import { OpeaGuardrailsStack } from '../../stacks/guardrails-stack';
import { ClusterAttributes } from 'aws-cdk-lib/aws-eks';
import { OpeaChatQnAStack } from '../../stacks/chatqna-stack';
import { OpeaOpensearchStack } from '../../stacks/opensearch-stack';
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

async function getAuthenticatedAccount(region:string):Promise<any> {
    const client = new STSClient({
        region
    });
    const command = new GetCallerIdentityCommand();
    const response = await client.send(command);
    return response
}

function setRoleInfo(arn:string) {
    if (arn.indexOf("assumed-role") > -1) {
        if (!process.env.OPEA_USER && !process.env.OPEA_ROLE_NAME) {
            throw new Error("Since you're using an assumed role, you must either set the value of the OPEA_USER environment variable to the username that is the principal of your assumed role's trust policy or set the value of OPEA_ROLE_NAME to the name of the IAM role that you're assuming.");
        }
        return;
    }
    process.env.OPEA_ROLE_ARN = arn;
}

export async function deploy(flags:CliArgFlags, args:CliArgArgs) {
    fromNodeProviderChain();
    const app = new App();
    const region = flags.region || process.env.CDK_DEFAULT_REGION  || process.env.AWS_REGION || 'us-east-1';
    process.env.AWS_REGION = region;
    const {Account, Arn} = await getAuthenticatedAccount(region as string);

    if (!Account) throw new Error("User must be signed in to AWS account before deploying");
    const account = Account;
    process.env.AWS_ACCOUNT = account;

    setRoleInfo(Arn);
    const stackProps = {
      env: { account, region }
    }

    if (!flags.cluster && flags.clusterName) {
        flags.cluster = getCluster(flags);
    }
    let eks: OpeaEksStack | undefined;
    if (!flags.cluster) {
        eks = new OpeaEksStack(app, 'OpeaEksStack', {
            ...stackProps,
            instanceType: flags.instanceType,
            diskSize: flags.diskSize
        });
    }
    const cluster = eks ? eks.root.cluster : flags.cluster as ClusterAttributes;
    let stack:Stack
    switch(flags.module || "") {
        case "guardrails": stack = new OpeaGuardrailsStack(app, 'OpeaChatQnAGuardrailsStack', cluster, stackProps);
        break;
        case "redis": stack = new OpeaChatQnAStack(app, 'OpeaChatQnARedisStack', cluster, stackProps);
        break;
        default: stack = new OpeaOpensearchStack(app, 'OpeaChatQnAOpensearchStack', cluster, stackProps);
        break;
    }
    if (eks) stack.addDependency(eks);
}