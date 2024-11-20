import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { pathFinder } from "../util";
import { ExampleModule } from "./example-module";
import { join } from "path";
import { DEFAULT_SCHEMA, dump, JSON_SCHEMA, loadAll } from "js-yaml";
import { ManifestKind, ManifestOverrides, KubernetesModuleOptions } from "../util/types";
import {merge} from 'lodash'
import { tmpdir } from "os";

export class KubernetesModule extends ExampleModule {
    kubernetesPath: string
    assets: ManifestKind[] = []
    containerName:string
    constructor(moduleName:string, protected options:KubernetesModuleOptions) {
        super(moduleName);
        if (!options.skipPackagedManifests) {
            const kubernetesPath = this.getKubernetesPath();
            if (!kubernetesPath) throw new Error(`Module ${this.moduleName} does not support kubernetes yet`);
            this.kubernetesPath = kubernetesPath;
            const manifestPath = pathFinder(this.kubernetesPath, 'manifest');
            if (manifestPath && options.container.name) {
                const manifestNames = readdirSync(manifestPath);
                for (let i = 0; i < manifestNames.length; i++) {   
                    const manifest = manifestNames[i];
                    const manifestName = manifest.split('.')[0];
                    const key = manifestName.replace(/-/g, '_').toLowerCase();
                    const containerName = options.container.name.replace(/-/g, '_').toLowerCase();
                    if (key === containerName) {
                        const fullpath = join(manifestPath, manifest);
                        this.containerName = manifestName;
                        const content = this.parseFile(fullpath);
                        this.assets = content as ManifestKind[];
                        break;
                    }  
                }
            }
        }
        if (options.container.manifestFiles?.length) {
            options.container.manifestFiles.forEach((mf:string) => {
                let fileContent = this.parseFile(mf);

                if (Object.keys(fileContent).length) { 
                    if (!Array.isArray(fileContent)) fileContent = [fileContent]
                    this.assets.push(...fileContent as ManifestKind[]);
                }
            })
        }
        if (options.container.manifests) this.assets = [...this.assets, ...(this.normalizeAssetData(options.container.manifests) as ManifestKind[])];

        let overrides:ManifestOverrides = (this.parseFile(options.container.overridesFile as string) || {}) as ManifestOverrides
        if (Array.isArray(overrides)) throw new Error(`Overrides file ${options.container.overridesFile} cannot be an array`);
        if (options.container.overrides) overrides = this.normalizeAssetData(merge(overrides, options.container.overrides)) as ManifestOverrides;
        this.parseOverrides(overrides);
        if (!this.assets.length) throw new Error("No manifests found");
    }

    get filename(): string {
        const ext = this.options.useYamlExtension ? '.yaml' : '.yml';
        return this.options.chartAssetName ? `${this.options.chartAssetName}${ext}` : 
            `${this.moduleName}-${this.containerName}${ext}`
        ;
    }

    private parseFile(filepath:string | Record<string,any>): Record<string,any> | ManifestOverrides | ManifestKind[] {
        if (typeof filepath === 'string') {
            if (filepath && existsSync(filepath)) {
                const file = readFileSync(filepath).toString('utf-8');
                if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) {

                    return loadAll(file, undefined, {
                        json:true,
                        schema: JSON_SCHEMA,
                        filename: filepath
                    });
                } else if (filepath.endsWith('.json')) {
                    return JSON.parse(file);
                } else return {}
            }
            return {}
        } else return filepath;
    }

    writeYaml(dir?: string, yml?:string): string {return this.writeYml(yml, dir)}
    writeYml(dir:string = "", yml?:string): string {
        const dirname = join(tmpdir(), dir);
        if (!existsSync(dirname)) {
            try {
                mkdirSync(dirname);
            } catch(e) {
                throw new Error(`Error writing yaml file: ${dirname}`);
            }
        }
        const file = join(dirname, this.filename);
        const text = yml ? yml : this.createYml();
        const testText = text.substring(0,10);
        
        writeFileSync(file, text);
        
        let res:string
        try {
            res = readFileSync(file).toString();
        } catch(e) {
            throw new Error(`Error writing yaml file: ${file}`);
        }
        if (res.substring(0, 10) !== testText) throw new Error(`Error writing yaml file: ${file}`);
        return file;
    }

    createYaml(): string {return this.createYml()}
    createYml(): string {
        return dump(this.assets, {
            schema: DEFAULT_SCHEMA,
            flowLevel:-1
        })
    }

    normalizeAssetData(add:Record<string,any> | (Record<string,any>)[]): ManifestKind[] | ManifestOverrides {
        const yaml = dump(add, {
            schema: DEFAULT_SCHEMA,
            flowLevel:-1
        });

        return (loadAll(yaml, undefined, {
            json:true,
            schema: JSON_SCHEMA
        })) as ManifestOverrides | ManifestKind[]
    }

    protected parseOverrides(overrides:ManifestOverrides) {
        Object.keys(overrides).forEach(override => {
            const chartIndex = this.assets.findIndex(a => a.metadata.name === override);
            if (chartIndex > -1) {
                const replacement = merge(this.assets[chartIndex], overrides[override]);
                this.assets.splice(chartIndex, 1, replacement as ManifestKind);
            }
        });
    }
}