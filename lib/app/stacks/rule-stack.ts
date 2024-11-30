import { DefaultStackSynthesizer, Stack, StackProps } from "aws-cdk-lib";
import { EventField, Rule, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import { Subscription, SubscriptionProtocol, Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

export class RuleStack extends Stack {
    constructor(scope:Construct, id:string, props:StackProps) {
        super(scope,id, {
            ...props,
            synthesizer: new DefaultStackSynthesizer({
              generateBootstrapVersionRule: false
            })
         })

        const account = EventField.fromPath("$.account");
        const stackId = EventField.fromPath("$.detail.stack-id");
        const status = EventField.fromPath("$.detail.status-details.status");
        const reason = EventField.fromPath("$.detail.status-details.status-reason");
        const message = `In account ${account}, stack ${stackId} just reached CloudFormation status ${status} for the following reason: ${reason}`;
        
        const topic = new SnsTopic(new Topic(this,"topic", {
            topicName: "Reinvent-Opea-Notify",
            displayName: "Reinvent-Opea-Notify"
        }), {
            message: RuleTargetInput.fromText(message)
        });
        new Subscription(this, "subscription", {
            protocol: SubscriptionProtocol.EMAIL,
            endpoint: "sguggenh@amazon.com",
            topic: topic.topic
        })
        new Subscription(this, "subscription2", {
            protocol: SubscriptionProtocol.EMAIL,
            endpoint: "stevenguggen@gmail.com",
            topic: topic.topic
        })
        new Subscription(this, "subscription3", {
            protocol: SubscriptionProtocol.SMS,
            endpoint: "+15042356883",
            topic: topic.topic
        })
        new Rule(this, "rule", {
            ruleName: "Reinvent-Opea-Notify-Updates",
            eventPattern: {
                source: ["aws.cloudformation"],
                detailType: ["CloudFormation Stack Status Change"],
                region: ["us-east-2"],
                detail: {
                    "status-details": {
                        status: ["CREATE_COMPLETE", "CREATE_FAILED", "REVIEW_IN_PROGRESS", "ROLLBACK_IN_PROGRESS", "UPDATE_FAILED", "DELETE_IN_PROGRESS"]
                    }
                }
            },
            targets: [
                topic
            ]
        })
    }
}