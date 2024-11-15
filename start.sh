#!/usr/bin/env bash

STACK_OPERATION=$1
npm install;

if [ "$STACK_OPERATION" == "delete" ]; then
    cdk destroy --force --all
else
    cdk bootstrap
    cdk synth --quiet
    aws s3 sync ./cdk.out/
    cdk deploy --require-approval never OpeaEksStack
fi