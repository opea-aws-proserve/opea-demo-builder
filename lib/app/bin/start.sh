#!/usr/bin/env bash

export OPEA_DEMO_BUILDER="https://github.com/opea-aws-proserve/opea-demo-builder.git"
rm -fr ./assets/genai-examples && git clone https://github.com/opea-project/GenAIExamples.git ./assets/GenaiExamples
chmod +x ./lib/app/bin/start.sh
cdk synth --quiet
cdk bootstrap --template ./lib/app/assets/templates/bootstrap-custom.yml
cdk deploy --require-approval never OpeaEksStack OpeaChatQnAStack
cdk deploy OpeaGuardrailsStack --require-approval never --method prepare-change-set --change-set-name guardrails-change-set
cdk deploy OpeaOpensearchStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
cdk deploy OpeaBedrockStack --require-approval never --method prepare-change-set --change-set-name opensearch-change-set
