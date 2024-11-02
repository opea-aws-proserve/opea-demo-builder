#!/usr/bin/env bash

STACK_OPERATION=$1

if [[ "$STACK_OPERATION" == "create" || "$STACK_OPERATION" == "update" ]]; then
    cdk bootstrap
    cdk deploy --require-approval never --all
elif [ "$STACK_OPERATION" == "delete" ]; then
    cdk destroy --force --all
else
    echo "Invalid stack operation!"
    exit 1
fi