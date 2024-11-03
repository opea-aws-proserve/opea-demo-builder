import { Repository } from "aws-cdk-lib/aws-ecr"
import { ClusterProps } from "aws-cdk-lib/aws-eks"

export interface ExampleModuleOptions {
    uiType?:string
    serverlessUi?:boolean
}

export interface KubernetesModuleOptions extends ExampleModuleOptions {

}

type StringObject = {
    [key: string]: string
}

type AnyObject = {
    [key: string]: any
}
export interface OpeaEksProps {
    module?: string
    clusterName?: string
    kubernetesVersion?: string
    albVersion?: string
    repository?: Repository
    clusterProps?: Partial<ClusterProps>
    environmentVariables?: StringObject
    logLevel?: string
    assetPaths?: string[]
    helmValues?: AnyObject
}

export interface OpeaHelmOptions {
    labels?: StringObject
    containers?: HelmContainer[]
    volumes?: HelmVolume[]
    data?: AnyObject
}

export interface HelmTemplate<Kind extends string> {
    apiVersion:string
    kind: Kind
    metadata?: HelmMetadata
}

export interface HelmTemplateConfigMap extends HelmTemplate<"ConfigMap"> {
    data: StringObject
}

export interface HelmTemplateService extends HelmTemplate<"Service"> {
    spec: HelmSpec
}

export interface HelmContainer {
    name: string
    image: string
    imagePullPolicy?: string
    ports: HelmPort[]
    resources?: AnyObject
    securityContext?: HelmSecurityContext
    volumeMounts?: HelmVolumeMount[]
    startupProbe?:HelmProbe
    livenessProbe?:HelmProbe
    readinessProbe?:HelmProbe
    args?:any
    envFrom?:AnyObject
    env?:AnyObject
}

export interface HelmMetadata {
    name?: string
    labels: StringObject
}

export interface HelmSpec {
    type: string
    ports: HelmPort[]
    selector: StringObject
}

export interface HelmDeploymentSpec {
    template: HelmSpecTemplate
    selector: {matchLabels: StringObject}
    replicas?:number
}
export interface HelmPort {
    port:number
    targetPort?:number
    containerPort?: number
    protocol?:string
    name?:string
}

export interface HelmSpecTemplate {
    metadata: HelmMetadata
    spec: {
        containers: HelmContainer[]
        securityContext?: HelmSecurityContext
        volumes?: HelmVolume[]
    }
}

export interface HelmVolumeMount {
    mountPath: string
    name?: string
}

export interface HelmVolume {
    name: string
    emptyDir?: {
        medium?:string
        sizeLimit?:string
    }
}

export interface HelmProbe {
    tcpSocket?: {port:number}
    httpGet?: {path:string, port:number | string}
    httpPost?: {path:string, port:number | string}
    httpPut?: {path:string, port:number | string}
    initialDelaySeconds?:number
    periodSeconds?:number
    failureThreshold?:number
}

export interface HelmSecurityContext {
    allowPrivilegeEscalation?: boolean
    capabilities?: AnyObject  
    readOnlyRootFilesystem?: boolean
    runAsNonRoot?: boolean
    runAsUser?: number
    seccompProfile?: { type: string }
}