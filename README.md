# OPEA ChatQnA with Amazon EKS

This package deploys the **ChatQnA** example from the [Open Platform for Enterprise AI (OPEA)](https://opea.dev) platform into an Amazon Elastic Kubernetes Service (EKS) cluster. The resulting container set up on EKS is a flexible and configurable Generative AI chatbot. 

## Quick Start


1. Get the container image from AWS Marketplace:
    - Run ```aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 709825985650.dkr.ecr.us-east-1.amazonaws.com```

    - Run ```docker pull 709825985650.dkr.ecr.us-east-1.amazonaws.com/intel/opea-eks-builder```

2. Place a file called `opea.env` in the directory that you are issuing commands from. Find the section below entitled [Required Parameters](#required-parameters), and place the values in `opea.env` in this format:

```
AWS_REGION=<your region>
AWS_ACCESS_KEY_ID=<your id>
AWS_SECRET_ACCESS_KEY=<your secret>"
AWS_SESSION_TOKEN=<your token (if assuming a role)>
HUGGING_FACE_TOKEN=<your token>
```
*NOTE: There are sensitive values in this file that should not be shared. Do not copy this file beyond your local drive.*

3. Include values in `opea.env` from the [Optional Parameters](#optional-parameters) and [The EKS Cluster](#the-eks-cluster) section if needed

4. Run the command ```docker run --env-file opea.env intel/opea-eks-builder:latest```

## Customizing OPEA ChatQnA

### Required Parameters

- **AWS_REGION** - The region you intend to deploy the cluster into
- **AWS_ACCESS_KEY_ID** - The access key for the user or role you'll be assuming in the AWS account.
- **AWS_SECRET_ACCESS_KEY** - The secret for the user of role you'll be assuming in the AWS account. If you're authenticating as an AWS user, these two values will suffice, but if you're assuming a role, you'll also need to set the **AWS_SESSION_TOKEN** parameter.
*WARNING: Make sure to protect your Access Key and secret values as they are highly sensitive. Be careful not to expose them in any insecure ways*
**HUGGING_FACE_TOKEN** - A valid token for Hugging Face scoped to use the models in your package. The default models are scoped to your token by default, but if you want to use `guardrails` with the default settings, you'll have to add the `meta-llama/Meta-Llama-Guard-2-8B` to your token scope.

### Optional Parameters

- **MODEL_ID** - The Hugging Face or Bedrock model id that you'd like to use as LLM
- **OPEA_MODULE** - If you deploy the package without setting any parameters, the layout will look like this:

1. Generative AI chatbot user interface
2. Large Language Models (LLM): TGI (Hugging Face; Intel/neural-chat-7b-v3-3)
3. Embedding Models: TEI (Hugging Face; BAAI/bge-base-en-v1.5)
4. Vector Database: (Opensearch)
5. Server (Nginx)

Use the **OPEA_MODULE** parameter to substitute the defaults with the following replacements:

1. **bedrock** - Substitutes Amazon Bedrock LLM's. The default is Anthropic Claude 3, but you can change the model by setting the **LLM_MODEL** environment variable.
2. **guardrails** - Add in guardrail support to monitor the content allowed through the model.
3. **redis** - Use redis as your vector DB 

*NOTE: More customizations coming soon*


### The EKS Cluster

You can customize the configuration of the EKS cluster that is created, or you can use an existing EKS cluster by passing in the **CLUSTER_NAME** parameter. If you choose to bring your own cluster in this manner, keep in mind that the settings of the cluster must support the OPEA platform requirements in order to properly work. 

Setting the **CLUSTER_NAME** parameter alone will signal that you intend to bring your own cluster, but it's still important to provide as many other details about the cluster as possible to make sure it works properly. You can pass in any value from the AWS CDK's [ClusterAttributes](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.ClusterAttributes.html). This includes, at a minimum, the value for **kubectlRoleArn** so the cluster can run `kubectl` commands. Keep all cluster attributes in camel case when setting the environment variables.

We recommend that you allow the application to create the cluster, and then pass in parameters to configure the new cluster as necessary. Parameters that you can set to configure the cluster include:

*WARNING: Keep in mind when you're sizing that you'll need enough RAM and storage to support all of the generative AI components.*

- **INSTANCE_TYPE** - The instance id of the instance class and instance size that you'd like to use (ex. ```M7I.4xlarge```). Supported instance types include any size of the `M7I`, `C7I`, or `R7I` instances, but keep in mind when you're sizing that you'll need enough RAM to support all of the generative AI components.

- **DISK_SIZE** - The amount of space (in GB) allotted to nodes in the cluster. We recommend using a minimum of 100.

## Features

Every OPEA configuration is built on three main parts : 

- **Megaservice** : Microservice "orchestrator". When deploying an end-to-end application with multiple parts involved, you need to specify the flow within the microservices. You can learn more from [OPEA documentation](https://github.com/opea-project/GenAIComps?tab=readme-ov-file#megaservice)

- **Gateway** : A gateway is the interface for users to access to the `megaservice` It acts as the entry point for incoming requests, routing them to the appropriate Microservices within the megaservice architecture.

- **Microservice** : Each individual microservice part of the end-to-end application like : **embeddings**, **retrievers**, **LLM** and **vector databases** among others.


### Guardrails

As AI becomes more integral in applications, ensuring reliable, safe, and ethical outcomes is critical. Guardrails in AI systems, especially those interacting with users or making decisions, help maintain control over responses, avoid unintended behaviors, and align output with set goals and standards. Without guardrails, AI models might generate unsafe or biased content, make inappropriate decisions, or mishandle sensitive data.

Implementing guardrails allows you to:

1. Enhance User Safety – By controlling responses, you reduce risks of harmful outputs in AI interactions.
2. Maintain Compliance – With privacy and safety regulations growing, guardrails ensure your applications remain within legal boundaries.
3. Optimize Accuracy – Guardrails can improve the quality of AI output, reducing error rates and providing more reliable performance.

Ultimately, guardrails allow you to harness the benefits of AI while mitigating risks, ensuring a more secure and trustworthy user experience.

### Vector Databases

A Vector Database (VDB) is a specialized database designed to store and manage high-dimensional vectors—numeric representations of data points like words, sentences, or images. In AI and machine learning, these vectors are typically embeddings, which capture the meaning and relationships of data in a format that algorithms can process efficiently, as we shown before. 

### OpenSearch

[OpenSearch](http://opensearch.org) is a search, analytics, and vector database solution. The OpenSearch Software Foundation, is a member of the Linux Foundation, providing open governance, for [the OpenSearch project on GitHub](https://github.com/opensearch-project).

OpenSearch is a search engine at its core. We're all familiar with search engines like web search engines, and product search engines, through using them daily to find information, products we want to buy, places we want to travel, and where we want to eat. When you use a search engine, you provide a text query, possibly augmented with some clickable attribute values, to express your information goal, and the search engine's job is to send back a set of search results that (hopefully) are relevant to meeting the information goal that motivated your search.

Search engines are specialized members of the databases world, designed to work in tandem with another data store (usually a relational database), to provide low-latency, high throughput search on large blocks of unformatted text; more structured, "metadata" fields that can contain text or numbers; and vectors. The core construct for search engines is the **index**, which like a database **table** is the container for data elements. In OpenSearch, the data elements are called **documents**, which are Javascript Object Notation (JSON) objects. Documents contain **fields**, which are the JSON keys (including all of the nested JSON), and **values**, which are the values for the keys. You query fields with text, numbers and numeric ranges, dates, geographic information, etc. to retrieve matching documents. When your queries involve matching unstructured text, OpenSearch sorts documents based on a **relevance** (similarity) score that favors matching words that are uncommon in the overall corpus of documents.

Recent advances in natural language have expanded the possibilities for how we interact with and retrieve relevant information. Large Language Models (LLMs) are able to encode language into high-dimension vector spaces, capturing the meaning of language in a way that enables matching meaning for meaning. Additionally, LLMs are capable of generating realistic natural-language responses for natural-language questions. Locating information now involves the possibility of conversing with a chat bot, adding textual and other types of information like images, audio, and video to the way you specify your information goal.

OpenSearch has two different uses in AI scenarios. OpenSearch can store and use vector embeddings, produced by embedding LLMs, to perform **semantic search**. In semantic search, OpenSearch uses nearest-neighbor matching on an embedding produced by the query to find neighbors in the vector space. In generative AI, OpenSearch can serve as the **knowledge base** for retrieving relevant information to add to the prompt. You've already seen how Redis can serve as a vector database. In this Task, you'll explore OpenSearch's search capabilities, its vector capabilities, and see how it integrates with OPEA.

### Bedrock

[Amazon Bedrock](https://aws.amazon.com/bedrock/?gclid=CjwKCAiAxqC6BhBcEiwAlXp454S0Ao8vI71eSYZSt7pGBdnNY9o6Nx8g9Mhgg7iLtNIfirRkPGdRihoCK9cQAvD_BwE&trk=36201f68-a9b0-45cc-849b-8ab260660e1c&sc_channel=ps&ef_id=CjwKCAiAxqC6BhBcEiwAlXp454S0Ao8vI71eSYZSt7pGBdnNY9o6Nx8g9Mhgg7iLtNIfirRkPGdRihoCK9cQAvD_BwE:G:s&s_kwcid=AL!4422!3!692006004850!e!!g!!amazon%20bedrock!21048268689!159639953975) is a fully managed service that offers a choice of high-performing foundation models (FMs) from leading AI companies like **AI21 Labs**, **Anthropic**, **Cohere**, **Meta**, **Mistral AI**, **Stability AI**, and Amazon itself through a single API, along with a broad set of capabilities that allow you to build generative AI applications with security, privacy, and responsible AI.

You can interact with the Amazon Bedrock API through the AWS Software Development Kit (SDK) or the AWS CLI, and you can use Bedrock's native features to build your own RAG knowledge bases, agentic workflows, and guardrails. Integrating Bedrock with OPEA allows you to access an even larger selection of foundation models, as well as leverage the power of Bedrock's features in combination with OPEA.

## What is OPEA?
In today’s fast-paced industry, staying up to date with the tools and best practices for building secure, reliable, and high-performance GenAI applications can be a real challenge. The rapid evolution of AI models, combined with the increasing complexity of deployment environments, means developers must constantly navigate new technologies, frameworks, and scalability concerns. Security, data integrity, and compliance standards add further pressure, making it critical to ensure applications not only perform well but also adhere to industry requirements.

For enterprises, the ability to implement AI solutions efficiently without sacrificing quality or time to market is essential for maintaining competitiveness. This demand for quick, scalable, and secure AI solutions requires a robust and streamlined approach, which is exactly where GenAI applications powered by tools like OPEA come in. By simplifying the deployment process and integrating best practices, OPEA helps developers overcome these challenges and deliver AI applications that meet enterprise demands. Before getting into the workshop, let’s cover the key technology you’ll use to create your RAG-based application.

[OPEA (Open Platform for Enterprise AI)](https://opea.dev) is an open source project under the *LF & AI Data Foundation* that provides a framework for enabling the creation and evaluation of open, multi-provider, robust, and composable generative AI (GenAI) solutions. OPEA simplifies the implementation of enterprise-grade composite GenAI solutions, starting with a focus on retrieval augmented generation (RAG). The platform is designed to facilitate the efficient integration and deployment of secure, performant, and cost-effective GenAI workflows into business systems , leading to quicker GenAI adoption and business value.OPEA is an open platform project that lets you create open, multi-provider, robust, and composable GenAI solutions that harness the best innovation across the ecosystem.

## What is Retrieval Augmented Generation (RAG)?
RAG is a technique that combines two powerful AI capabilities: information retrieval and large language model (LLM) generation. Instead of relying solely on the LLM’s knowledge, RAG pulls in relevant, up-to-date information from external data sources, such as databases or documents, to augment the model's responses. This enhances accuracy and relevance and helps reduce hallucinations, especially for enterprise use cases where real-time or domain-specific knowledge is critical.

In this workshop, you'll leverage OPEA to build a RAG-based application that retrieves and processes external data, delivering more accurate and context-aware responses. This approach ensures your AI model not only generates human-like text but also incorporates the most relevant information to meet enterprise demands. The modular nature of OPEA allows you to easily integrate key components, such as applying safety guardrails and optimizing performance. By deploying RAG applications on AWS using OPEA, you'll experience firsthand how RAG can drive scalable, secure GenAI workflows tailored for enterprise use.

## OPEA Project 
OPEA uses microservices to create high-quality GenAI applications for enterprises, simplifying the scaling and deployment process for production. These microservices leverage a service composer that assembles them into a megaservice thereby creating real-world enterprise AI applications.

It’s important to familiarize yourself with the three key elements of OPEA:

1. [**GenAIComps**](https://github.com/opea-project/GenAIComps) 
A collection of microservice components that form a service-based toolkit. Each microservice is designed to perform a specific function or task within the GenAI application architecture. By breaking down the system into these smaller, self-contained services, microservices promote modularity, flexibility, and scalability. This modular approach allows developers to independently develop, deploy, and scale individual components of the application, making it easier to maintain and evolve over time. All of the microservices are containerized, allowing cloud native deployment. Here you will find contributions to multiple partners/community to further construction.

2. [**GenAIExamples**](https://github.com/opea-project/GenAIExamples)
While *GenAIComps* offers a range of microservices, *GenAIExamples* provides practical, deployable solutions to help users implement these services effectively. This repo provides use-case-based applications that demonstrate how the OPEA architecture can be leveraged to build and deploy real-world GenAI applications. In the repo, developers can find practical resources such as Docker Compose files and Kubernetes Helm charts, which help streamline the deployment and scaling of these applications. These resources allow users to quickly set up and run the examples in local or cloud environments, ensuring a seamless experience.

3. [**GenAIEval**](https://github.com/opea-project/GenAIEval)
Another important part when deployoing GenAI applications is the evaluation of these components. In the *GenAIEval* repo you’ll find evaluation, benchmarking, and scorecards focused on performance in terms of throughput and latency, accuracy based on popular evaluation benchmarks, safety, and hallucination detection.

## Be involved with OPEA
OPEA is an open source project that welcomes contributions in many forms. Whether you're interested in fixing bugs, adding new GenAI components, improving documentation, or sharing your unique use cases, there are numerous ways to get involved and make a meaningful impact. 

We’re excited to have you on board and look forward to the contributions you'll bring to the OPEA platform. 

For detailed instructions on how to contribute, please check out our [Contributing Documentation](https://opea-project.github.io/latest/community/CONTRIBUTING.html).

Follow the project and stay tuned for new events!





