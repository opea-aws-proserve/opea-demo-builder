import { 
    fromEnv, 
    fromIni, 
    fromProcess,
    fromNodeProviderChain
} from "@aws-sdk/credential-providers";
import { 
    STSClient, 
    STSClientConfig, 
    GetCallerIdentityCommand,
    AssumeRoleCommand, 
    AssumeRoleWithWebIdentityCommand, 
    AssumeRoleWithWebIdentityCommandInput, 
    AssumeRoleWithWebIdentityCommandOutput, 
    AssumeRoleWithSAMLCommand,
    AssumeRoleWithSAMLCommandInput,
    AssumeRoleWithSAMLCommandOutput,
    AssumeRoleCommandInput,
    AssumeRoleCommandOutput
} from "@aws-sdk/client-sts";
import { AwsCredentialIdentity, AwsCredentialIdentityProvider, Credentials } from "@aws-sdk/types";
import { AwsCredentialHelperProps, ClientIniCredentialsProps, ClientRoleProps, CredentialsType } from "./types";
import { randomBytes } from "crypto";
/** 
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/#fromini 
 * */

export class AwsCredentialHelper {
    region: string
    type: CredentialsType
    readonly roleIdentifier = randomBytes(4).toString("hex");
    credentials: AwsCredentialIdentityProvider | AwsCredentialIdentity
    roleCredentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider
    private $props:AwsCredentialHelperProps;
    static async Get(props:AwsCredentialHelperProps): Promise<AwsCredentialIdentityProvider | AwsCredentialIdentity> {
        const $this = new AwsCredentialHelper(props);
        return await $this.assume(props);
    }

    static async SignIn($props:AwsCredentialHelperProps): Promise<AwsCredentialIdentityProvider | AwsCredentialIdentity> {
        const $this = new AwsCredentialHelper($props);
        return $this.assume($props);
    }

    static async Configure($props:AwsCredentialHelperProps): Promise<AwsCredentialIdentityProvider | AwsCredentialIdentity> {
        const $this = new AwsCredentialHelper($props);
        return $this.assume($props);
    }

    constructor(props: AwsCredentialHelperProps = {}) {
        this.$props = props;
        this.region = props.region || "us-east-2";
        /*if (props.fromEnv || (process.env.AWS_ACCESS_KEY_ID && !props.fromProcess && !props.fromIni)) {
            this.env();
        } else if (props.fromProcess) this.process(props)
        else this.ini(props);*/
       this.credentials = fromNodeProviderChain()
    }

    get roleProps(): ClientRoleProps {
        return {
            roleArn: this.$props.roleArn,
            webIdentityToken: this.$props.webIdentityToken,
            samlAssertion: this.$props.samlAssertion,
            principalArn: this.$props.principalArn,
            roleConfig: this.$props.roleConfig
        }
    }

    async assume($config?:ClientRoleProps):Promise<AwsCredentialIdentity | AwsCredentialIdentityProvider> {
        if (this.roleCredentials && !$config) return this.roleCredentials;
        this.$props = {
            ...this.$props,
            ...$config
        }
        const config = this.roleProps;
        if (config.roleArn) {
            let response: AssumeRoleCommandOutput | AssumeRoleWithWebIdentityCommandOutput | AssumeRoleWithSAMLCommandOutput;
            if (config.webIdentityToken) {
                response = await this.assumeWebIdentity(config.roleArn, config.webIdentityToken, config.roleConfig);
            } else if (config.principalArn && config.samlAssertion) {
                response = await this.assumeSamlRole(config.roleArn, config.principalArn, config.samlAssertion, config.roleConfig);
            } else response = await this.assumeRole(config.roleArn, config.roleConfig);
            this.roleCredentials = response.Credentials as unknown as AwsCredentialIdentity;
        }
        return this.roleCredentials || this.credentials;
    }

    env() {
        this.type = CredentialsType.FROM_ENV;
        this.credentials = fromEnv()
    }

    ini(props: string | ClientIniCredentialsProps = {}) {
        this.type = CredentialsType.FROM_INI;
        if (typeof props === "string") props = {profile:props}
        this.credentials = fromIni({
            profile: process.env.profile || process.env.PROFILE || process.env.AWS_PROFILE || props.profile,
            filepath:  process.env.AWS_FILEPATH || props.filepath,
            configFilepath: process.env.AWS_CONFIG_FILEPATH || props.configFilepath
        })
    }

    process(props: string | ClientIniCredentialsProps = {}) {
        this.type = CredentialsType.FROM_PROCESS;
        if (typeof props === "string") props = {profile:props}
        this.credentials = fromProcess({
            profile: process.env.profile || process.env.PROFILE || process.env.AWS_PROFILE || props.profile,
            filepath: process.env.AWS_FILEPATH || props.filepath,
            configFilepath: process.env.AWS_CONFIG_FILEPATH || props.configFilepath
        })
    }

    async assumeRole(
        roleArn:string, 
        config: Partial<AssumeRoleCommandInput> = {}, 
        stsConfig: Partial<STSClientConfig> = {}
    ): Promise<AssumeRoleCommandOutput> {
        const client = new STSClient({
            credentials: this.credentials,
            region: this.region,
            ...stsConfig
        });

        const command = new AssumeRoleCommand({
            RoleArn: roleArn,
            RoleSessionName: this.roleIdentifier,
            ...config
        });
        const response = await client.send(command);
        return response;
    }

    async assumeWebIdentity(
        roleArn:string, 
        token:string, 
        config: Partial<AssumeRoleWithWebIdentityCommandInput> = {}, 
        stsConfig: Partial<STSClientConfig> = {}
    ): Promise<AssumeRoleWithWebIdentityCommandOutput> {
        const client = new STSClient({
            credentials: this.credentials,
            region: this.region,
            ...stsConfig
        });

        const command = new AssumeRoleWithWebIdentityCommand({
            RoleArn: roleArn,
            RoleSessionName: this.roleIdentifier,
            WebIdentityToken: token,
            ...config
        });
        const response = await client.send(command);
        return response;
    }

    async assumeSamlRole(
        roleArn:string, 
        principalArn:string, 
        assertion:string, 
        config: Partial<AssumeRoleWithSAMLCommandInput> = {}, 
        stsConfig: Partial<STSClientConfig> = {}
    ): Promise<AssumeRoleWithSAMLCommandOutput> {
        const client = new STSClient({
            credentials: this.credentials,
            region: this.region,
            ...stsConfig
        });

        const command = new AssumeRoleWithSAMLCommand({
            RoleArn: roleArn,
            PrincipalArn: principalArn,
           SAMLAssertion: assertion,
            ...config
        });
        const response = await client.send(command);
        return response;
    }

    async isAuthenticated():Promise<boolean> {
        const client = new STSClient({
            region: this.region
        });
        const command = new GetCallerIdentityCommand();
        const response = await client.send(command);
        return !!(response.UserId)
    }
}