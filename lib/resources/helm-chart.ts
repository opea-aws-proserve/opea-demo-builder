import { Duration } from "aws-cdk-lib";
import { Cluster, HelmChart, HelmChartOptions, HelmChartProps } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";




export class OpeaHelmChart extends HelmChart {

    static Options(props: HelmChartOptions): HelmChartOptions {
        return {
            timeout: Duration.minutes(15),
            wait: true,
            ...props,
        }
    }

    constructor(
        scope: Construct, 
        id: string, 
        cluster: Cluster,
        props: HelmChartOptions = {}
    ) {
        super(scope, id, {
            ...OpeaHelmChart.Options(props),
            cluster

        });
    }
}