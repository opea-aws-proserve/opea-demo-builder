import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { pathFinder } from "../util";
import { ExampleModule } from "./example-module";
import { join } from "path";
import { DEFAULT_SCHEMA, dump, JSON_SCHEMA, loadAll } from "js-yaml";
import { ManifestKind, ManifestOverrides, KubernetesModuleOptions } from "../types";
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
            if (manifestPath) {
                const assets = readdirSync(manifestPath).reduce((acc,manifest) => {
                    const key = manifest.split('.')[0].replace(/-/g, '_');
                    const fullpath = join(manifestPath, manifest);
                    const content = this.parseFile(fullpath);
                    if (Object.keys(content).length) acc[key] = content
                    return acc;
                }, {} as Record<string,any>);
                if (options.container.name) {
                    const keys = Object.keys(assets);
                    const containerKey = keys.find(containerName => (new RegExp((options.container.name as string).replace(/\-\_\:\\\/\(\)/, ""), 'i')).test(containerName));
                    if (containerKey) this.containerName = containerKey;
                    else this.containerName = keys[0];
                } else this.containerName = Object.keys(assets)[0];
                this.assets = assets[this.containerName];
            }
        }
        if (options.container.manifestFiles?.length) {
            options.container.manifestFiles.forEach((mf:string) => {
                const fileContent = this.parseFile(mf);
                if (fileContent) this.assets.push(...fileContent as ManifestKind[]);
            })
        }
        if (options.container.manifests) this.assets = [...this.assets, ...options.container.manifests];

        let overrides:ManifestOverrides = this.parseFile(options.container.overridesFile as string) || {}
        if (Array.isArray(overrides)) throw new Error(`Overrides file ${options.container.overridesFile} cannot be an array`);
        if (options.container.overrides) overrides = {...overrides, ...options.container.overrides};
        this.parseOverrides(overrides);


        if (this.useContainerizedUi) {
            // TODO: Add logic for containerized UI after full docker support is added
        }
    }

    get filename(): string {
        const ext = this.options.useYamlExtension ? '.yaml' : '.yml';
        return this.options.chartAssetName ? `${this.options.chartAssetName}${ext}` : 
            `${this.moduleName}-${this.containerName}${ext}`
        ;
    }

    parseFile(filepath:string | Record<string,any>): Record<string,any> {
        if (typeof filepath === 'string') {
            if (filepath && existsSync(filepath)) {
                const file = readFileSync(filepath).toString('utf-8');
                if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) {

                    return loadAll(file, undefined, {
                        json:true,
                        schema: JSON_SCHEMA,
                        filename: filepath
                    }) as unknown as ManifestOverrides;
                } else if (filepath.endsWith('.json')) {
                    return JSON.parse(file) as ManifestOverrides;
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