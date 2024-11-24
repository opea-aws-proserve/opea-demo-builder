#!/usr/bin/env bash

export OPEA_DEMO_BUILDER="https://github.com/opea-aws-proserve/opea-demo-builder.git"
rm -fr ./assets/genai-examples && git clone https://github.com/opea-project/GenAIExamples.git ./assets/genai-examples
#export OPEA_ROLE_ARN=$OPEA_ROLE_ARN
#export OPEA_ROLE_NAME=$OPEA_ROLE_NAME
#export OPEA_USER=$OPEA_USER
#export HUGGINGFACEHUB_API_TOKEN=$HUGGING_FACE_TOKEN
cdk synth --quiet
cdk bootstrap
cdk deploy --require-approval never OpeaEksStack OpeaChatQnAStack
cdk deploy OpeaGuardrailsStack --require-approval never --method prepare-change-set --change-set-name guardrails-change-set
cdk deploy OpeaOpensearchStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
# cdk deploy OpeaBedrockStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
