// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as Util from '../lib/util-stack';
import { writeFileSync } from "fs";
import { KubernetesModule } from "../lib/construct/modules/kubernetes-module";
import { ManifestTemplateConfigMap, ManifestTemplateService } from "../lib/construct/util/types";

describe("Module functions", () => {
    it("Check assets", () => {
       
       // writeFileSync('x.json',JSON.stringify(new KubernetesModule('ChatQnA').assets, null, '\t'))
       const kb = new KubernetesModule('ChatQnA', {
        container: {
            name: "chatqna",
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
        }
       });
       const rerank = kb.assets.find(n => n.metadata.name === "chatqna-teirerank")!
       expect(kb.assets[0].metadata.labels["helm.sh/chart"]).toEqual("data-prep-1.0.1")
       expect(kb.assets[0].metadata.labels["app.kubernetes.io/version"]).toEqual("v1.1")
       expect(rerank.metadata.labels["app.kubernetes.io/version"]).toEqual("cpu-1.6")
       expect((rerank as ManifestTemplateService).spec.ports[0].targetPort).toEqual(2083)
    });

    it("Separates manifests", () => {
        const kb = new KubernetesModule('ChatQnA', {
            container: {
                name: "chatqna"
            }
        });
        expect(kb.assets.every(a => !(/guardrails/i.test(a.metadata.name)))).toBeTruthy();
        const kg = new KubernetesModule('ChatQnA', {
            container: {
                name: "chatqna-guardrails"
            }
        });
        expect(kg.assets.some(a => (/guardrails/i.test(a.metadata.name)))).toBeTruthy();
    });
});

describe("Tokens", () => {
    it("Token is replaced", () => {
        const kb = new KubernetesModule('ChatQnA',  {
            container: {
                name:'chatqna',
                overrides: {
                    "chatqna-retriever-usvc-config": {
                        data: {
                            HUGGINGFACEHUB_API_TOKEN: "token"
                        }
                    },
                    "chatqna-data-prep-config": {
                        data: {
                            HUGGINGFACEHUB_API_TOKEN: "token"
                        }
                    }
                }
            }
        });
        const retriever = kb.assets.find(n => n.metadata.name === "chatqna-retriever-usvc-config");
        expect((retriever as ManifestTemplateConfigMap).data["HUGGINGFACEHUB_API_TOKEN"]).toEqual("token");
        const prep = kb.assets.find(n => n.metadata.name === "chatqna-data-prep-config");
        expect((prep as ManifestTemplateConfigMap).data["HUGGINGFACEHUB_API_TOKEN"]).toEqual("token");
    })

})