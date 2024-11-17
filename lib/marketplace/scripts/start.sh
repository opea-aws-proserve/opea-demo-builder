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
   # cdk deploy --require-approval never OpeaEksStack
    cdk deploy --require-approval never --all
    export TEMPLATE_BUCKET=$(aws ssm get-parameter --name template-bucket --query Parameter.Value --output text)
    aws s3 sync "./cdk.out" "s3://$TEMPLATE_BUCKET/cloudformation"
    npm run copy-repo;
    zip -r ./workshop.zip ./workshop/
    aws s3 cp "./workshop.zip" "s3://$TEMPLATE_BUCKET/opea-workshop-builder.zip"

fi