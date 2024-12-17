#!/usr/bin/env bash
export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION --public-access-block-configuration false --qualifier opea --toolkit-stack-name OpeaBootstrap
cdk deploy --require-approval never --app "npx ts-node ./lib/app/bin/marketplace/index.ts" --all