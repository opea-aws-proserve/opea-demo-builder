#!/usr/bin/env bash
export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
cdk bootstrap --template ./lib/app/assets/templates/bootstrap-custom.yml aws://$AWS_ACCOUNT/$AWS_REGION 
cdk deploy --require-approval never --app "npx ts-node ./lib/app/bin/marketplace/index.ts" --all
