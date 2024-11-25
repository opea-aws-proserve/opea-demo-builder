#!/usr/bin/env node

import { ClusterAttributes } from "aws-cdk-lib/aws-eks";
import { CliArgFlags } from "../cli-args";

export function setenv(): CliArgFlags {
    let flags:CliArgFlags = {}, clusterName:string = ""
    if (process.env.INSTANCE_TYPE) flags.instanceType = process.env.INSTANCE_TYPE
    if (process.env.DISK_SIZE) flags.diskSize = process.env.DISK_SIZE
    if (process.env.OPEA_MODULE) flags.module = process.env.OPEA_MODULE
    else if (process.env.MODULE) flags.module = process.env.MODULE
    if (process.env.clusterName || process.env.CLUSTER_NAME) clusterName = (process.env.clusterName || process.env.CLUSTER_NAME) as string
    
    if (clusterName) flags.cluster = getCluster(process.env);

    return flags
}

export function getCluster(flags:any): ClusterAttributes {
    const strAttributes = ['clusterName','clusterCertificateAuthorityData',
        'clusterEncryptionConfigKeyArn', 'clusterEndpoint', 
        'clusterHandlerSecurityGroupId', 'clusterSecurityGroupId',
        'kubectlRoleArn', 'kubectlSecurityGroupId', 'vpc'
    ]

    const strArrays = ['securityGroupIds','kubectlPrivateSubnetIds']

    if (!flags.clusterName) throw new Error("Cluster name is required to import an EKS cluster");
    const attr:any = {clusterName:flags.clusterName}

    strAttributes.forEach(a => {
        if (flags.hasOwnProperty(a)) attr[a] = flags[a];
    })
    strArrays.forEach(a => {
        if (flags.hasOwnProperty(a)) attr[a] = flags[a].split(',').map((b:string) => b.trim());
    })
    if (flags.prune) attr.prune = true;
    return flags as ClusterAttributes;
}