import { AlbControllerVersion, ClusterLoggingTypes, KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";


export function getVersionNumber(vString:string | number): number {
    const v = vString.toString()
        .replace(/[\_\-]/gi, '.')
        .replace(/[^\d\.]/gi,'');
    return Number(v);
}

export function getLatestKVersion(): KubernetesVersion {
    const keys = Object.keys(KubernetesVersion).map(k => getVersionNumber(k));
    keys.sort((a, b) => {
        return a - b;
    })
    return KubernetesVersion.of(keys[keys.length - 1].toString())
}

export function getKVersion(vString?:string | KubernetesVersion):KubernetesVersion {
    if (!vString) return getLatestKVersion();
    if (typeof vString !== 'string') return vString;
    const v = getVersionNumber(vString).toString();
    return KubernetesVersion.of(v);
}

export function getLatestAlbVersion(): AlbControllerVersion {
    const keys = Object.keys(AlbControllerVersion).map(k => getVersionNumber(k));
    keys.sort((a, b) => {
        return a - b;
    })
    return AlbControllerVersion.of(keys[keys.length - 1].toString())
}

export function getAlbVersion(vString?:string | AlbControllerVersion):AlbControllerVersion {
    if (!vString) return getLatestAlbVersion();
    if (typeof vString !== 'string') return vString;
    const v = getVersionNumber(vString).toString();
    return AlbControllerVersion.of(v);
}

export function getClusterLogLevel(logLevel: string = '', prop:ClusterLoggingTypes[] = []): ClusterLoggingTypes[] {
    const api = ClusterLoggingTypes.API;
    const audit = ClusterLoggingTypes.AUDIT;
    const authenticator = ClusterLoggingTypes.AUTHENTICATOR;
    const controllerManager = ClusterLoggingTypes.CONTROLLER_MANAGER;
    const scheduler = ClusterLoggingTypes.SCHEDULER;
    if (logLevel === 'none') return [];
    if (ClusterLoggingTypes.hasOwnProperty(logLevel)) return [logLevel as ClusterLoggingTypes];
    if (['verbose', 'all'].includes(logLevel)) return [api,audit,authenticator,controllerManager,scheduler];
    if (prop.length) return prop;
    return [api,authenticator];
}

export function capitalize(a:string, delimiter:string = ""): string {
    return a.split(/[\_\-]/g).map(b =>
        b.charAt(0).toUpperCase() + b.slice(1)).join(delimiter);
}

export function pathFinder(pathName:string, $lookFor:string = 'xeon'): string | undefined {
    const lookFors = $lookFor.split(/[\/\\]/g);
    const lookFor = lookFors.pop()!;
    pathName = join(pathName, ...lookFors);
    const paths = readdirSync(pathName).filter(a => lstatSync(join(pathName,a)).isDirectory());
    if (!paths.length) return undefined;

    if (paths.some(a => (new RegExp(lookFor, 'i')).test(a))) return join(pathName, lookFor);
    for (let i = 0; i < paths.length; i++) {
        let thisPath = join(pathName, paths[i]);
        const res = pathFinder(thisPath, lookFor);
        if (res) return res;
    }
    return undefined;
}
