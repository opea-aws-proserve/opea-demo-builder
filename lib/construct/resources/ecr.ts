import { Construct } from "constructs";
import { OpeaImageProps } from "../util/types";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { CfnOutput } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class OpeaImages extends Construct {
    dataprep: DockerImageAsset
    retriever: DockerImageAsset

    constructor(
        scope:Construct, 
        protected id:string, 
        protected props:OpeaImageProps
    ) {
        super(scope, id);

        const buildArgs = {
            https_proxy: "",
            http_proxy: ""
        }
        this.dataprep = new DockerImageAsset(this, "dataprep-opensearch", {
            directory: props.directory,
            file: props.dataprepPath,
            assetName: "dataprep-opensearch",
            buildArgs
        })    

        this.retriever = new DockerImageAsset(this, "retriever-opensearch-server", {
            directory: props.directory,
            file: props.retrieverPath,
            assetName: "retriever-opensearch-server",
            buildArgs
        });

        new CfnOutput(this, "dataprep-opensearch-output", {
            exportName: "dataprep-opensearch-uri",
            value: this.dataprep.imageUri
        });

        new CfnOutput(this, "retriever-opensearch-server-output", {
            exportName: "retriever-opensearch-server-uri",
            value: this.retriever.imageUri
        });

        new StringParameter(this, "dataprep-opensearch-parameter", {
            parameterName: "dataprep-opensearch-uri",
            stringValue: this.dataprep.imageUri
        });

        new StringParameter(this, "retriever-opensearch-server-parameter", {
            parameterName: "retriever-opensearch-server-uri",
            stringValue: this.retriever.imageUri
        });


    }
}