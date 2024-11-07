// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as Util from '../lib/util-stack';
import { KubernetesModule } from "../lib/helpers/kubernetes-module";
import { writeFileSync } from "fs";
import { HelmTemplateService } from "../lib/types";

describe("Module functions", () => {
    it("Check assets", () => {
       
       // writeFileSync('x.json',JSON.stringify(new KubernetesModule('ChatQnA').assets, null, '\t'))
       const kb = new KubernetesModule('ChatQnA', {
        overrides: {
            "chatqna-data-prep-config": {
                "metadata": {
                    "labels": {
                       "helm.sh/chart": "data-prep-1.0.1",
                        "app.kubernetes.io/version": "v1.1"
                    }
                }
            },
            "chatqna-teirerank": {
                "metadata": {
                    "labels": {
                        "app.kubernetes.io/version": "cpu-1.6"
                    }
                },
                "spec": {
                    "ports": [{targetPort:2083}]
                }
            }
        }
       });
       const rerank = kb.assets.find(n => n.metadata.name === "chatqna-teirerank")!
       expect(kb.assets[0].metadata.labels["helm.sh/chart"]).toEqual("data-prep-1.0.1")
       expect(kb.assets[0].metadata.labels["app.kubernetes.io/version"]).toEqual("v1.1")
       expect(rerank.metadata.labels["app.kubernetes.io/version"]).toEqual("cpu-1.6")
       expect((rerank as HelmTemplateService).spec.ports[0].targetPort).toEqual(2083)
       console.log(kb.createYml());
    });

})