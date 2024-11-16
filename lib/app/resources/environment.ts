import { CfnEnvironmentEC2 } from "aws-cdk-lib/aws-cloud9";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { Construct } from "constructs";
import { join } from "path";


export class OpeaDevelopmentEnvironment extends Construct {
    constructor(scope:Construct, id:string) {
        super(scope,id);

        const rep = new Repository(this, `${id}-rep`, {
            repositoryName: 'opea-demo-builder'
        });

        const env = new CfnEnvironmentEC2(this, `${id}-dev-env`, {
            imageId: 'amazonlinux-2023-x86_64',
            instanceType: 't3.large',
            repositories: [
                {
                    repositoryUrl: rep.repositoryCloneUrlHttp,
                    pathComponent: join(__dirname, '../../../workshop')
                }
            ]
        });
        env.node.addDependency(rep);
    }

}