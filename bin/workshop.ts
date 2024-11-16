#!/usr/bin/env node

import { join } from "path"
import * as packagejson from '../package.json';
import { copyFileSync, cp, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs";

const base = join(__dirname, '..');
const root = join(base, "workshop");

if (existsSync(root)) rmSync(root, {recursive:true, force:true});
mkdirSync(join(base, "workshop"));
const copyFiles = [
    ".gitignore",
    "tsconfig.json",
    "LICENSE",
    "cdk.json",
];
copyFiles.forEach(file => {
    copyFileSync(join(base,file), join(root, file));
});

const pjson:any = {...packagejson}
pjson.name = "opea-workshop-builder"
pjson.bin = {
    opea: "./bin"
}
writeFileSync(join(root,"package.json"), JSON.stringify(pjson, null, '\t'));

cpSync(join(base,"workshop-files/"), root, {recursive:true});
cpSync(join(base, "lib/"), join(root, "lib"), {recursive:true});

