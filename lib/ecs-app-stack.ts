import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecrdeploy from "cdk-ecr-deployment";
import * as logs from "aws-cdk-lib/aws-logs";

import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class EcsAppStack extends cdk.Stack {
  /**
   * Represents the ECS App Stack.
   * @class
   * @constructor
   * @param {Construct} scope - The scope in which this stack is defined.
   * @param {string} id - The ID of the stack.
   * @param {cdk.StackProps} [props] - The stack properties.
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const certificateArn = process.env.CERTIFICATE_ARN;
    if (!certificateArn) {
      throw new Error("CERTIFICATE_ARN environment variable is not set");
    }

    const { accountId, region } = new cdk.ScopedAws(this);
    const resourceName = "sirius";

    const ecrNginxRepo = new ecr.Repository(
      this,
      `${resourceName}-nginx-repo`,
      {
        repositoryName: `${resourceName}-nginx`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        imageScanOnPush: true,
      }
    );

    // create Docker image asset for Nginx
    const nginxImageAsset = new ecr_assets.DockerImageAsset(
      this,
      "NginxImage",
      {
        directory: "./app",
        platform: ecr_assets.Platform.LINUX_AMD64,
      }
    );

    new ecrdeploy.ECRDeployment(this, "DeployNginxImage", {
      src: new ecrdeploy.DockerImageName(nginxImageAsset.imageUri),
      dest: new ecrdeploy.DockerImageName(
        `${accountId}.dkr.ecr.${region}.amazonaws.com/${ecrNginxRepo.repositoryName}:latest`
      ),
    });

    // Create VPC

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      vpcName: `${resourceName}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/20"),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${resourceName}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: vpc,
      clusterName: `${resourceName}-cluster`,
    });

    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/aws/ecs/${resourceName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ACM Certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateArn
    );

    const ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "FargateService",
      {
        loadBalancerName: `${resourceName}-lb`,
        publicLoadBalancer: true,
        cluster: cluster,
        serviceName: `${resourceName}-service`,
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 2,
        assignPublicIp: true,
        protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        listenerPort: 443,
        certificate: certificate,
        taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        taskImageOptions: {
          family: `${resourceName}-taskdef`,
          containerName: `${resourceName}-container`,
          image: ecs.ContainerImage.fromEcrRepository(ecrNginxRepo, "latest"),
          logDriver: new ecs.AwsLogDriver({
            logGroup: logGroup,
            streamPrefix: `${resourceName}-container`,
          }),
        },
      }
    );

    // Output the DNS where you can access your service
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: ecsService.loadBalancer.loadBalancerDnsName,
      description: "Load Balancer DNS",
    });
  }
}
