#!/usr/bin/env node

import { exec } from "child_process";
import CliArgs from "./cli-args";

const {flags,args} = CliArgs.Get();

const command = args.shift();


switch (command) {
    case "deploy": const $toDeploy = args.shift() as string;
        deploy($toDeploy, flags, args);
        break;
    case "set": const $toSet = args.shift() as string;
        set($toSet, flags,args);
        break;
    default: throw new Error(`${command} is not a valid command`);
}

function deploy(toDeploy:string, flags:Record<string,any>, args:(string|number)[]) {
    if (/guardrail/i.test(toDeploy)) toDeploy = "OpeaGuardrailsStack";
    else if (/chat/i.test(toDeploy)) toDeploy = "OpeaChatQnAStack";
    const stack = flags.all ? "--all" : toDeploy;

    exec(`cdk deploy --require-approval never ${stack}`);
}

function set(toSet:string, flags:Record<string,any>, args:(string|number)[]) {
    switch(toSet) {
        case "token": process.env.HUGGING_FACE_TOKEN = (flags.token || args[0]) as string;
        break;
        case "user": process.env.OPEA_USERS = (flags.user || args[0]) as string;
        break;
        case "role": process.env.OPEA_ROLE_NAME = (flags.role || args[0]) as string;
        break;

    }
}