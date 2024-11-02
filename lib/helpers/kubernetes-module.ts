import { readdirSync, readFileSync } from "fs";
import { pathFinder } from "../util";
import { ExampleModule } from "./example-module";
import { join } from "path";
import { JSON_SCHEMA, load, loadAll } from "js-yaml";


export class KubernetesModule extends ExampleModule {
    kubernetesPath: string
    assets: {[name:string]: Record<string,any>} = {}
    
    constructor(moduleName:string) {
        super(moduleName);
        const kubernetesPath = this.getKubernetesPath();
        if (!kubernetesPath) throw new Error(`Module ${this.moduleName} does not support kubernetes yet`);
        this.kubernetesPath = kubernetesPath;
        const manifestPath = pathFinder(this.kubernetesPath, 'manifest');
        if (manifestPath) {
            this.assets = readdirSync(manifestPath).reduce((acc,manifest) => {
                if (manifest.endsWith('.yaml') || manifest.endsWith('.yml')) {
                    const key = manifest.split('.')[0].replace(/-/g, '_');
                    const fullpath = join(manifestPath, manifest);
                    const text = readFileSync(fullpath).toString('utf-8');
                    acc[key] = loadAll(text, undefined, {
                        json:true,
                        schema: JSON_SCHEMA,
                        filename: fullpath
                    });
                }
                return acc;
            }, {} as Record<string,any>);
        }
    }

    createYml() {

    }
}