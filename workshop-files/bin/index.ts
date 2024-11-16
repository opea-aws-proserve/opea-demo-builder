#!/usr/bin/env node

import { execSync } from 'child_process';
import CliArgs from './cli-args';

const {flags, args} = CliArgs.Get();

const command = args.shift();

switch (command) {
    case "token": process.env.HUGGING_FACE_TOKEN = (flags.HUGGING_FACE_TOKEN || flags.token || flags.TOKEN || args.shift()) as string;
    break;
    case "deploy": execSync(`cdk deploy --require-approval never ${/(chatqna|guardrails)/i.test((args[0] as string || "").toString()) ? args[0].toString() : "--all"}`);
    break;
    case "set": const nextArg = args.shift() as string;
        set(nextArg, flags, args);
    break;
    default: `${command} is not a valid command`
}

function set(arg:string, flags:Record<string,any>, args:(string | number)[]) {
    if (arg === "token") {
        process.env.HUGGING_FACE_TOKEN = (flags.HUGGING_FACE_TOKEN || flags.token || flags.TOKEN || args.shift()) as string;
    } else if (/search/i.test(arg)) {

    }
}