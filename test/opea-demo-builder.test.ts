import { App, Stack } from "aws-cdk-lib";
import { OpeaEksCluster } from "../lib";
import { ImportedCluster } from "../lib/construct/resources/imported";
const app = new App();
describe('Check cluster builds', () => {
    it('Imported clusters works without containers', () => {
        const stack = new Stack(app, 'stack');
        const cluster = new OpeaEksCluster(stack, 'cluster', {
            moduleName: 'ChatQnA',
            skipPackagedManifests:true
        });
        const manifests = new ImportedCluster(stack, 'imported', {
            moduleName: 'ChatQnA',
            skipPackagedManifests:true,
            cluster:cluster.cluster,
            manifests: [{
                apiVersion:"v1",
                kind: "Service",
                metadata: {
                    name: "manifest",
                    labels: {
                        label: "metadata"
                    }
                },
                spec: {
                   type: "Spec",
                   ports: [{port:80}],
                   selector: {selector:'selector'}
                }
            }]
        })
        expect(manifests.kubernetesModules[0]!.assets.length).toEqual(1);
    });
});
