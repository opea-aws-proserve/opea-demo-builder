#!/usr/bin/env bash

cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
cdk deploy --require-approval never --app "npx ts-node ./lib/app/bin/marketplace/index.ts" --all
