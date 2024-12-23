import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { createArn } from "../util";

export class OpeaWorkshopPolicy extends Construct {
    root:ManagedPolicy

    constructor(scope:Construct, id:string, additionalStatements:PolicyStatement[] = []) {
        super(scope,id);
        this.root = new ManagedPolicy(scope, id, {
            managedPolicyName: id,
            description: "Attach this policy to your user or assumed role in order to perform console actions for the Opea workshop.",
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "cloudformation:ExecuteChangeSet",
                        "cloudformation:CreateChangeSet",
                        "cloudformation:DescribeStacks",
                        "cloudformation:DescribeChangeSet",
                        "cloudformation:ListChangeSets",
                        "cloudformation:ListExports",
                        "cloudformation:ListStacks",
                        "cloudformation:UpdateStack"
                    ],
                    resources: [
                        createArn(this, "OpeaChatQnAStack/*", "cloudformation:stack"),
                        createArn(this, "OpeaGuardrailsStack/*", "cloudformation:stack"),
                        createArn(this, "OpeaBedrockStack/*", "cloudformation:stack"),
                        createArn(this, "OpeaOpensearchStack/*", "cloudformation:stack"),
                        createArn(this, "OpeaRemoteInferenceStack/*", "cloudformation:stack"),
                    ]
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "bedrock:InvokeModel",
                        "bedrock:InvokeModelWithResponseStream",
                        "bedrock:PutFoundationModelEntitlement"
                    ],
                    resources: ["*"]
                }),
                ...additionalStatements
            ]
        });
    }
}