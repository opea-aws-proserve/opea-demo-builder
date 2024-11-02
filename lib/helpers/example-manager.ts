import { lstatSync, readdirSync } from "fs"
import { join } from "path"

export const examplePath = join(__dirname, '../../assets', 'genai-examples');



export class ExampleManager {

    moduleNames:string[]

    
    constructor() {
        this.moduleNames = this.getModules();
    }


    isModule(possibleModule: string, moduleName?:string): boolean {
        possibleModule = this.stripModule(possibleModule);
        if (moduleName) return (new RegExp(possibleModule, 'i')).test(moduleName);
        return this.moduleNames.some(a => 
            (new RegExp(possibleModule, 'i')).test(a)
        );
    }

    findModule(possibleModule: string): string | undefined {
        possibleModule = this.stripModule(possibleModule);
        return this.moduleNames.find(a =>
            (new RegExp(possibleModule, 'i')).test(a)
        );
    }

    protected getModules() {
        return readdirSync(examplePath).filter(a => 
            !a.startsWith('.') && lstatSync(join(examplePath, a)).isDirectory()
        );
    }

    protected stripModule(possibleModule:string): string {
        return possibleModule.replace(/[^a-z]/gi, '');
    }
}