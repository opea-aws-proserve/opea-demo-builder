// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as Util from '../lib/util-stack';
import { join } from "path";
import { ExampleManager, examplePath } from "../lib/helpers/example-manager";
import { getVersionNumber, getLatestKVersion, capitalize, pathFinder } from "../lib/util";
import { KubernetesModule } from "../lib/helpers/kubernetes-module";
// example test. To run these tests, uncomment this file along with the
// example resource in lib/util-stack.ts
// test('SQS Queue Created', () => {
//   const app = new cdk.App();
//     // WHEN
//   const stack = new Util.UtilStack(app, 'MyTestStack');
//     // THEN
//   const template = Template.fromStack(stack);

//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
// });

describe('Kubernetes version', () => {
    it('Kubernetes version returns proper number', () => {
        expect(getVersionNumber('V1_23')).toEqual(1.23);
        expect(getVersionNumber(1.23)).toEqual(1.23);
        expect(getVersionNumber('1_23')).toEqual(1.23);
        expect(getVersionNumber('V1.23')).toEqual(1.23);
        expect(getVersionNumber('Q1-23')).toEqual(1.23);
    })

    it('Kubernetes version returns proper object', () => {
        expect(Number(getLatestKVersion().version)).not.toBeNaN();
       
    })
});

describe("Util functions", () => {
    it("capitalize works", () => {
        expect(capitalize("test")).toEqual("Test");
        expect(capitalize("give_me_capitals")).toEqual("GiveMeCapitals");   
        expect(capitalize("give_me_capitals", "-")).toEqual("Give-Me-Capitals");    
        expect(pathFinder(join(examplePath, "ChatQnA/kubernetes"))).toEqual(join(examplePath, "ChatQnA/kubernetes/intel/cpu/xeon"))   
    
        console.log((new KubernetesModule('ChatQnA')).assets)
    });

})