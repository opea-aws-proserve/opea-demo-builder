#!/usr/bin/env bash

STACK_OPERATION=$1
npm install;
npm run build;
if [ "$STACK_OPERATION" == "delete" ]; then
    cdk destroy --force --all
else
    export OPEA_DEMO_BUILDER="https://github.com/opea-aws-proserve/opea-demo-builder.git"
    cdk synth --quiet
    cdk bootstrap
    cdk deploy --require-approval never OpeaEksStack OpeaChatQnAStack
    cdk deploy OpeaGuardrailsStack --require-approval never --method prepare-change-set --change-set-name guardrails-change-set
    cdk deploy OpeaOpensearchStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
    cdk deploy OpeaBedrockStack --require-approval never --method prepare-change-set --change-set-name bedrock-change-set
#    cdk deploy --all --require-approval never --method prepare-change-set --change-set-name chatqna-change-set

fi