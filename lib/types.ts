import { InstanceType } from "aws-cdk-lib/aws-ec2"
import { ClusterProps, HelmChartOptions } from "aws-cdk-lib/aws-eks"


export interface OpeaEksProps {
    module: string
    principal?:string
    containers?:string[]
    moduleOptions?: KubernetesModuleOptions
   // helmChartOptions?: Omit<HelmChartOptions, 'chart' | 'chartAsset' | 'repository' | 'version'>
    clusterName?: string
    kubernetesVersion?: string
    albVersion?: string
    clusterProps?: Partial<ClusterProps>
    environmentVariables?: StringObject
    logLevel?: string
    instanceType?: InstanceType
    additionalInstanceTypes?: InstanceType[]
}

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ExampleModuleOptions {
    uiType?:string
    serverlessUi?:boolean
}

export interface KubernetesModuleOptions extends ExampleModuleOptions {
    containerName?: string
    overridesFile?: string
    overrides?: ManifestOverrides
    chartAssetName?:string
    useYamlExtension?:boolean
  //  manifestOptions?: OpeaManifestOptions
}

type StringObject = {
    [key: string]: string
}

type AnyObject = {
    [key: string]: any
}

export interface OpeaManifestOptions {
    labels?: StringObject
    containers?: ManifestContainer[]
    volumes?: ManifestVolume[]
    data?: AnyObject
}

export interface ManifestTemplate<Kind extends string> {
    apiVersion:string
    kind: Kind
    metadata: ManifestMetadata
}

export interface ManifestTemplateConfigMap extends ManifestTemplate<"ConfigMap"> {
    data: StringObject
}

export interface ManifestTemplateService extends ManifestTemplate<"Service"> {
    spec: ManifestSpec
}

export interface ManifestTemplateDeployment extends ManifestTemplate<"Deployment"> {
    spec: ManifestDeploymentSpec
}

export interface ManifestContainer {
    name: string
    image: string
    imagePullPolicy?: string
    ports: ManifestPort[]
    resources?: AnyObject
    securityContext?: ManifestSecurityContext
    volumeMounts?: ManifestVolumeMount[]
    startupProbe?:ManifestProbe
    livenessProbe?:ManifestProbe
    readinessProbe?:ManifestProbe
    args?:any
    envFrom?:AnyObject
    env?:AnyObject
}

export interface ManifestMetadata {
    name: string
    labels: StringObject
    namespace?:string
}

export interface ManifestSpec {
    type: string
    ports: ManifestPort[]
    selector: StringObject
}

export interface ManifestDeploymentSpec {
    template: ManifestSpecTemplate
    selector: {matchLabels: StringObject}
    replicas?:number
}
export interface ManifestPort {
    port:number
    targetPort?:number
    containerPort?: number
    protocol?:string
    name?:string
}

export interface ManifestSpecTemplate {
    metadata: Partial<ManifestMetadata>
    spec: {
        containers: ManifestContainer[]
        securityContext?: ManifestSecurityContext
        volumes?: ManifestVolume[]
    }
}

export interface ManifestVolumeMount {
    mountPath: string
    name?: string
}

export interface ManifestVolume {
    name: string
    emptyDir?: {
        medium?:string
        sizeLimit?:string
    }
}

export type ManifestKind = (ManifestTemplateConfigMap | ManifestTemplateDeployment | ManifestTemplateService)

export interface ManifestOverrides {
    [name:string]: RecursivePartial<ManifestKind> 
}

export interface ManifestProbe {
    tcpSocket?: {port:number}
    httpGet?: {path:string, port:number | string}
    httpPost?: {path:string, port:number | string}
    httpPut?: {path:string, port:number | string}
    initialDelaySeconds?:number
    periodSeconds?:number
    failureThreshold?:number
}

export interface ManifestSecurityContext {
    allowPrivilegeEscalation?: boolean
    capabilities?: AnyObject  
    readOnlyRootFilesystem?: boolean
    runAsNonRoot?: boolean
    runAsUser?: number
    seccompProfile?: { type: string }
}