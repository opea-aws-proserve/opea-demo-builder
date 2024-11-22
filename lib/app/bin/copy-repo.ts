#!/usr/bin/env node

import { copyFileSync, cpSync, existsSync, mkdirSync, rmdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as packagejson from "../../../package.json";

const pkg:any = {...packagejson};

const base = join(__dirname, "../../..");
const root = join(base, "workshop");

if (existsSync(root)) rmdirSync(root, {recursive:true});
mkdirSync(root);
cpSync(join(base, 'lib/app'), join(root, 'lib/app'), {recursive:true});
cpSync(join(base, 'lib/construct'), join(root, 'lib/construct'), {recursive:true});
cpSync(join(base, 'assets/GenaiExamples/ChatQnA'), join(root, 'assets/GenaiExamples/ChatQnA'), {recursive:true});

["LICENSE", ".gitignore", "cdk.json", "tsconfig.json"].forEach(a => copyFileSync(join(base, a), join(root, a)));
copyFileSync(join(base, "README.workshop.md"), join(root, "README.md"));
pkg.name = "opea-workshop-builder";
pkg.bin = {
    opea: "./lib/app/bin"
}
pkg.scripts.postinstall = "npm run build && npm link";

writeFileSync(join(root, "package.json"), JSON.stringify(pkg,null,'\t'));