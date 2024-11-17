# OPEA Demo Builder

This is a CDK library that will build the constructs that make up the Opea CDK application. This package will allow users to select any module from Opea's GenAIExamples that has Kubernetes support (support for docker compose can be added in the future), and create an EKS cluster using any combination of components.

The `KubernetesModule` class automatically consumes all xeon manifests from the chosen example module, converts them into JSON objects, and combines with user-provided values either passed as arguments or within their own config file. Once the JSON objects are fully customized, they are then converted into Kubernetes manifests and passed to the CDK's EKS module.

Running `cdk synth` at the top level of the stack package (coming soon) will output an Amazon CloudFormation template that will deploy these resources into any AWS account.

# Environment Variables

- **OPEA_ROLE_NAME** - Name of role you'll be assuming
- **OPEA_ROLE_ARN** - Arn of role you'll be assuming
- **OPEA_USERS** - Name of user
*NOTE: only use one of the above 3*

- **HUGGING_FACE_TOKEN** - Access token for hugging face models