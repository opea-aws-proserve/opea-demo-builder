import { join } from "path";
import { ExampleManager, examplePath } from "./example-manager";
import { pathFinder } from "../util";
import { existsSync } from "fs";
import { ExampleModuleOptions } from "../util/types";

export class ExampleModule {
    readonly moduleName:string;
    readonly modulePath:string;
    manager = new ExampleManager();
    protected options:ExampleModuleOptions


    constructor(moduleName:string, options:ExampleModuleOptions = {}) {
        this.options = {
            uiType: 'react',
            ...options
        }
        const name = this.manager.findModule(moduleName);
        if (!name) throw new Error(`Module ${moduleName} not found`);
        this.moduleName = name;
        this.modulePath = join(examplePath, this.moduleName);
    }

    get useServerlessUi():boolean {
        return !!this.options.uiType && 
            !(/(none|docker)/i.test(this.options.uiType)) &&
            !!this.options.serverlessUi &&
            !!this.getUiPath();
    }

    get useContainerizedUi(): boolean {
        return /docker/i.test(this.options.uiType || '') &&
            !!this.getUiPath();
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

    getUiPath(): string | undefined {
        if (!this.options?.uiType || this.options.uiType === 'none') return undefined;
        return pathFinder(this.modulePath, `ui/${this.options.uiType}`);
    }

}