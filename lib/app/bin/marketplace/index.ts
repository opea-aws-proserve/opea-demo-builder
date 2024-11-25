#!/usr/bin/env node

import CliArgs from '../cli-args';
import { existsSync, readFileSync } from 'fs';
import { merge } from 'lodash';
import { join } from 'path';
import { deploy } from './deploy';
import { setenv } from './env';

let {flags,args} = CliArgs.Get();

const envFlags = setenv();
flags = merge(flags, envFlags);
const jsonPath = join(process.cwd(), "opea.config.json");
const tsPath = join(process.cwd(), "opea.config.ts");
if (existsSync(jsonPath)) {
    const json = readFileSync(jsonPath, "utf8");
    const jsonconfig = JSON.parse(json);
    flags = merge(jsonconfig,flags);
}
if (existsSync(tsPath)) {
    import(tsPath).then((config) => {
        const def = config.default || {}
        const newflags = merge(flags, {...def,...config});
        deploy(newflags, args);
    }).catch(e => {throw e;})
} else deploy(flags, args);