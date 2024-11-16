import { join } from "path";
import { ExampleManager, examplePath } from "./example-manager";
import { pathFinder } from "../util";
import { existsSync } from "fs";
import { ExampleModuleOptions } from "../util/types";

export class ExampleModule {
    readonly moduleName:string;
    readonly modulePath:string;
    manager = new ExampleManager();


    constructor(moduleName:string, protected options:ExampleModuleOptions = {}) {

        const name = this.manager.findModule(moduleName);
        if (!name) throw new Error(`Module ${moduleName} not found`);
        this.moduleName = name;
        this.modulePath = join(examplePath, this.moduleName);
    }

    getComposePath():string | undefined {
        return pathFinder(this.modulePath, 'docker_compose/intel/xeon');
    }

    getKubernetesPath(): string | undefined {
        return pathFinder(this.modulePath, 'kubernetes/intel/xeon');
    }

    getBuildPath(): string | undefined {
        const pathname = pathFinder(this.modulePath, 'docker_image_build');
        if (!pathname) return undefined;
        let res = join(pathname, 'build.yaml');
        if (!existsSync(res)) res = join(pathname, 'build.yml');
        if (!existsSync(res)) return undefined;
        return res;
    }

}