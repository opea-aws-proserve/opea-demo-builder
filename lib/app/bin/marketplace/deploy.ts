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
import { OpeaBedrockStack } from '../../stacks/bedrock-stack';

async function getAuthenticatedAccount(region:string):Promise<any> {
    const client = new STSClient({
        region
    });
    const command = new GetCallerIdentityCommand();
    const response = await client.send(command);
    return response
}

function setRoleInfo(arn:string):Record<string,string> {
    if (arn.indexOf("assumed-role") > -1) {
        const roles = arn.split("/");
        const ind = roles.findIndex((v) => v.endsWith("assumed-role"));
        if (ind < 0) throw new Error("Unable to determine assumed role");
        const rolename = roles[ind + 1];
        if (!rolename) throw new Error("Unable to determine assumed role");
        return {role: rolename};
    } else return { arn };
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

    const principals = setRoleInfo(Arn);
    if (principals.role) process.env.OPEA_ROLE_NAME = principals.role;
    else if (principals.arn) process.env.OPEA_ROLE_ARN = principals.arn;
    const stackProps = {
      env: { account, region }
    }
    if (flags.SKIP_NAMESPACE || flags.skipNamespace || flags.skip_namespace) process.env.SKIP_NAMESPACE = "true";
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
        case "bedrock": stack = new OpeaBedrockStack(app, 'OpeaChatQnARedisStack', cluster, stackProps);
        default: stack = new OpeaOpensearchStack(app, 'OpeaChatQnAOpensearchStack', cluster, stackProps);
        break;
    }
    if (eks) stack.addDependency(eks);
}