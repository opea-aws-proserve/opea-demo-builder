#!/usr/bin/env node

import CliArgs, { CliArgArgs, CliArgFlags } from "./lib/app/bin/cli-args";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { spawn } from "child_process";
import { join } from "path";

const {flags,args} = CliArgs.Get();
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

function addEnv(env:Record<string,string |undefined>, skipMutate?:boolean): string[] {
    const $cmds:string[] = [];
    Object.keys(env).forEach(e => {

        let key:string;
        if (!skipMutate) {
            const indexOf = e.indexOf("_");
            e = e.replace("-", "_");
            if (indexOf < 0 && /[a-z]/.test(e)) {
                key = e.replace(/([A-Z])/g, (a,b) => `_${b}`).toUpperCase()
            } else {
                key = e.toUpperCase();
            }
        } else key = e
        if (typeof env[e] === "undefined") env[e] = "";
        process.env[key] = env[e];
    });
    return $cmds;
}

async function run(flags:CliArgFlags,args:CliArgArgs) {
    fromNodeProviderChain();
   
    const envMap:any = {
        AWS_REGION:process.env.AWS_REGION || process.env.REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION,
        AWS_ROLE_ARN:process.env.AWS_ROLE_ARN,
        OPEA_MODULE:process.env.OPEA_MODULE || process.env.MODULE,
        OPEA_ROLE_ARN:process.env.OPEA_ROLE_ARN,
        OPEA_ROLE_NAME:process.env.OPEA_ROLE_NAME,
        OPEA_USER:process.env.OPEA_USER,
        MODEL_ID:process.env.MODEL_ID,
        INSTANCE_TYPE:process.env.INSTANCE_TYPE,
        CLUSTER_NAME:process.env.CLUSTER_NAME || process.env.clusterName,
        DISK_SIZE:process.env.DISK_SIZE,
        AWS_ACCESS_KEY_ID:process.env.AWS_ACCESS_KEY_ID, 
        AWS_SECRET_ACCESS_KEY:process.env.AWS_SECRET_ACCESS_KEY, 
        AWS_SESSION_TOKEN:process.env.AWS_SESSION_TOKEN, 
        AWS_WEB_IDENTITY_TOKEN_FILE:process.env.AWS_WEB_IDENTITY_TOKEN_FILE, 
        HUGGING_FACE_TOKEN:process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACEHUB_TOKEN, 
        HUGGINGFACEHUB_TOKEN:process.env.HUGGINGFACEHUB_TOKEN || process.env.HUGGING_FACE_TOKEN
    }
    if (process.env.SKIP_NAMESPACE) envMap.SKIP_NAMESPACE = true;
    const {Account, Arn} = await getAuthenticatedAccount(envMap.AWS_REGION as string);
    const account = Account;
    if (!account) throw new Error("User must be signed in to AWS account before deploying");
    envMap.AWS_ACCOUNT = account;
    setRoleInfo(Arn);
    addEnv(flags);
    addEnv(envMap, true);
  
}

run(flags,args)
const init = join(__dirname, "lib/app/bin/marketplace/index.sh")
spawn(init, {stdio:"inherit"});