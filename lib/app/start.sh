#!/usr/bin/env bash

STACK_OPERATION=$1
npm install;
ts-node ./bin/workshop.ts
cd ./workshop
npm install && npm run build && npm link
cd ..

if [ "$STACK_OPERATION" == "delete" ]; then
    cdk destroy --force --all
else
    cdk synth --quiet
    cdk bootstrap
    cdk deploy --require-approval never OpeaEksStack
   # cdk deploy --require-approval never --all
fi