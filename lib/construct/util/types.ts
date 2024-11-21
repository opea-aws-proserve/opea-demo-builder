import { InstanceType, IVpc, SecurityGroup, SubnetSelection } from "aws-cdk-lib/aws-ec2"
import { Cluster, ClusterProps, HelmChartOptions } from "aws-cdk-lib/aws-eks"
import { Asset } from "aws-cdk-lib/aws-s3-assets"


export interface OpeaEksProps {
    moduleName: string
    modelId?:string
    containers?:KubernetesModuleContainer[]
    skipKeyPair?: boolean
    skipPackagedManifests?:boolean
   // helmChartOptions?: Omit<HelmChartOptions, 'chart' | 'chartAsset' | 'repository' | 'version'>
    clusterName?: string
    kubernetesVersion?: string
    albVersion?: string
    vpc?:IVpc
    subnets?: SubnetSelection[]
    securityGroup?: SecurityGroup
    clusterProps?: Partial<ClusterProps>
    environmentVariables?: StringObject
    logLevel?: string
    instanceType?: InstanceType
    additionalInstanceTypes?: InstanceType[]
    principal?:string
    nodeGroupDiskSize?:number
    moduleOptions?: KubernetesModuleOptions
    defaultNamespace?:string
}

export interface OpeaImageProps {
    directory:string
    dataprepPath:string
    retrieverPath: string
}

export interface OpeaManifestProps {
    cluster:Cluster
    moduleName:string
    containers?:KubernetesModuleContainer[]
    manifestFiles?:string[]
    manifests?: ManifestKind[]
    helmChart?:HelmProps
    namespace?:string
    skipPackagedManifests?:boolean
}

export interface HelmProps {
    chart?: {
        name:string
        repo?:string
    }
    asset?: Asset
    options?:Omit<HelmChartOptions,'chart' | 'chartAsset' | 'repository'>
}

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ExampleModuleOptions {}

export interface KubernetesModuleContainer {
    name?:string
    namespace?: string
    overridesFile?: string
    overrides?: ManifestOverrides
    manifestFiles?:string[]
    manifests?: ManifestKind[]
    helmChart?:HelmProps
}

export interface KubernetesModuleOptions extends ExampleModuleOptions {
    container:KubernetesModuleContainer
    skipPackagedManifests?:boolean
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
    annotations?:Record<string,string>
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
    annotations?:Record<string,string>
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