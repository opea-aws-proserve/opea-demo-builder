import { AssumeRoleCommandInput, AssumeRoleWithSAMLCommandInput, AssumeRoleWithWebIdentityCommandInput } from "@aws-sdk/client-sts"
import { ClusterAttributes } from "aws-cdk-lib/aws-eks"

export interface OpeaChatQnAEksProps {
    instanceType?:string
    diskSize?:string
    cluster?: ClusterAttributes
    module?: "default" | "guardrails" | "redis" | "opensearch"
}

export interface ClientRoleProps {
    roleArn?: string
    principalArn?:string
    samlAssertion?: string
    webIdentityToken?: string
    roleConfig?: AssumeRoleCommandInput | AssumeRoleWithWebIdentityCommandInput | AssumeRoleWithSAMLCommandInput
  }
  
  export interface AwsCredentialHelperProps extends ClientIniCredentialsProps, ClientRoleProps {
    region?: string
    accessKey?: string
    secret?: string
    sessionToken?: string
    fromProcess?: boolean
    fromEnv?: boolean
    fromIni?: boolean
  }
  
  export interface ClientIniCredentialsProps {
    profile?: string
    filepath?: string
    configFilepath?: string
  }
  
  export enum CredentialsType {
    FROM_ENV = "fromEnv",
    FROM_INI = "fromIni", 
    FROM_PROCESS = "fromProcess"
  }
  
  export interface CredentialsFile {
    aws_access_key_id: string
    aws_secret_access_key: string
    aws_session_token?:string
    region?: string
    source_profile?: string
    role_arn?:string
    credential_source?:string
    web_identity_token_file?:string
  }
  
  export interface CredentialsEnvironment {
    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string
    AWS_SESSION_TOKEN?: string
    AWS_CREDENTIAL_EXPIRATION?: string
  }