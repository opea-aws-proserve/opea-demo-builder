#!/usr/bin/env node

import CliArgs from "./cli-args";

const {flags,args} = CliArgs.Get();

const command = args.shift();


switch (command) {

    default: throw new Error(`${command} is not a valid command`);
}