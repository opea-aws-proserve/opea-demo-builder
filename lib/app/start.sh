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
    cdk deploy --require-approval never OpeaEksStack
   # cdk deploy --require-approval never --all
    export WORKSHOP_BUCKET=$(aws ssm get-parameter --name workshop-bucket --query Parameter.Value --output text)
    aws s3 sync "." "s3://$WORKSHOP_BUCKET/opea-demo-builder"
    aws s3 sync "./cdk.out/OpeaChatQnAStack.template.json" "s3://$WORKSHOP_BUCKET/cloudformation/OpeaChatQnAStack.json"
    aws s3 sync "./cdk.out/OpeaGuardrailsStack.template.json" "s3://$WORKSHOP_BUCKET/cloudformation/OpeaGuardrailsStack.json"
fi