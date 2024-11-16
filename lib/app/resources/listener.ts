import { Stack } from "aws-cdk-lib";
import { ApplicationLoadBalancer, IApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export interface ListenerProps {
    loadBalancer:IApplicationLoadBalancer
}

export class OpeaListener extends Construct {
    constructor(scope:Construct, id:string, props:ListenerProps) {
        super(scope,id);

        const lb = ApplicationLoadBalancer.fromLookup(this, `${id}-ilb`, {
            loadBalancerArn: `arn:aws:elasticloadbalancing:${Stack.of(this).region}:${Stack.of(this).account}:loadbalancer/app/chatqna-ingress/0acd483e60bb9479`
        })
    }

}