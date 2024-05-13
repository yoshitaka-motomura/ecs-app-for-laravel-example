import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";

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

    /**
     * Represents the imported VPC.
     */
    const vpc = new ec2.Vpc(this, "ImportedVpc", {
      vpcName: "your_vpc_name",
    });

    /**
     * Represents the ECS cluster for the EcsService.
     */
    const cluster = new ecs.Cluster(this, "EcsServiceCluster", {
      vpc: vpc,
    });

    /**
     * Docker image asset for PHP-FPM.
     */
    const phpFpmImage = new ecr_assets.DockerImageAsset(this, "PhpFpmImage", {
      directory: ".",
      file: "dockerfile/php/Dockerfile",
      platform: ecr_assets.Platform.LINUX_AMD64,
    });

    /**
     * Docker image asset for Nginx.
     */
    const nginxImage = new ecr_assets.DockerImageAsset(this, "NginxImage", {
      directory: ".",
      file: "dockerfile/nginx/Dockerfile",
      platform: ecr_assets.Platform.LINUX_AMD64,
    });

    /**
     * Task definition for the ECS service.
     */
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "MyTaskDefinition"
    );

    // task definition append php-fpm container
    taskDefinition.addContainer("app", {
      image: ecs.ContainerImage.fromDockerImageAsset(phpFpmImage),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [
        {
          containerPort: 9000,
        },
      ],
    });

    // task definition append nginx container
    taskDefinition.addContainer("nginx", {
      image: ecs.ContainerImage.fromDockerImageAsset(nginxImage),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [
        {
          containerPort: 80,
        },
      ],
    });

    // create the ECS service
    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "MyFargateService",
      {
        cluster: cluster,
        taskDefinition: taskDefinition,
        publicLoadBalancer: true,
      }
    );
  }
}
