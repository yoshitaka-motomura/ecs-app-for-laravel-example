import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecrdeploy from "cdk-ecr-deployment";
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

    // /**
    //  * Represents the imported VPC.
    //  */
    // const vpc = ec2.Vpc.fromLookup(this, "ImportedVpc", {
    //   vpcName: "app-vpc",
    // });

    // /**
    //  * Represents the ECS cluster for the EcsService.
    //  */
    // const cluster = new ecs.Cluster(this, "EcsServiceCluster", {
    //   vpc: vpc,
    // });

    // /**
    //  * Docker image asset for PHP-FPM.
    //  */
    // const phpFpmImage = new ecr_assets.DockerImageAsset(this, "PhpFpmImage", {
    //   directory: ".",
    //   file: "dockerfile/php/Dockerfile",
    //   platform: ecr_assets.Platform.LINUX_AMD64,
    // });

    // /**
    //  * Docker image asset for Nginx.
    //  */
    // const nginxImage = new ecr_assets.DockerImageAsset(this, "NginxImage", {
    //   directory: ".",
    //   file: "dockerfile/nginx/Dockerfile",
    //   platform: ecr_assets.Platform.LINUX_AMD64,
    // });

    // /**
    //  * Task definition for the ECS service.
    //  */
    // const taskDefinition = new ecs.FargateTaskDefinition(
    //   this,
    //   "MyTaskDefinition",
    //   {
    //     memoryLimitMiB: 1024,
    //     cpu: 512,
    //   }
    // );

    // // task definition append php-fpm container
    // taskDefinition.addContainer("app", {
    //   image: ecs.ContainerImage.fromDockerImageAsset(phpFpmImage),
    //   memoryLimitMiB: 512,
    //   cpu: 256,
    //   portMappings: [
    //     {
    //       containerPort: 9000,
    //       hostPort: 9000,
    //       protocol: ecs.Protocol.TCP,
    //     },
    //   ],
    // });

    // // task definition append nginx container
    // taskDefinition.addContainer("nginx", {
    //   image: ecs.ContainerImage.fromDockerImageAsset(nginxImage),
    //   memoryLimitMiB: 512,
    //   cpu: 256,
    //   portMappings: [
    //     {
    //       containerPort: 80,
    //       hostPort: 80,
    //       protocol: ecs.Protocol.TCP,
    //     },
    //   ],
    //   essential: true,
    // });

    // // create the ECS service
    // new ecs_patterns.ApplicationLoadBalancedFargateService(
    //   this,
    //   "MyFargateService",
    //   {
    //     cluster: cluster,
    //     taskDefinition: taskDefinition,
    //     publicLoadBalancer: true,
    //   }
    // );
  }
}
