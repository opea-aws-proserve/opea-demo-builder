#!/usr/bin/env bash

STACK_OPERATION=$1

if [[ "$STACK_OPERATION" == "Create" || "$STACK_OPERATION" == "Update" ]]; then
    npm install;
    npm run build;
    export OPEA_DEMO_BUILDER="https://github.com/opea-aws-proserve/opea-demo-builder.git"
    export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
#    cdk synth --quiet
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION --public-access-block-configuration false
    cdk deploy --require-approval never OpeaEksStack
#    cdk deploy OpeaEksStack --require-approval never --method prepare-change-set --change-set-name eks-change-set
    cdk deploy OpeaChatQnAStack --require-approval never --method prepare-change-set --change-set-name default-change-set
    cdk deploy OpeaGuardrailsStack --require-approval never --method prepare-change-set --change-set-name guardrails-change-set
    cdk deploy OpeaOpensearchStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
    cdk deploy OpeaBedrockStack --require-approval never --method prepare-change-set --change-set-name bedrock-change-set
    
    if [[ -n $REMOTE_INFERENCE_CLIENT_ID ]]; then    
        cdk deploy OpeaRemoteInferenceStack --require-approval never --method prepare-change-set --change-set-name denvr-change-set
    fi
elif [ "$STACK_OPERATION" == "Delete" ]; then
    cdk destroy --force --all
fi