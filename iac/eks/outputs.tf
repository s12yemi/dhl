data "aws_caller_identity" "current" {}

output "cluster_name" {
  description = "EKS cluster name."
  value       = aws_eks_cluster.this.name
}

output "aws_region" {
  description = "AWS region."
  value       = var.aws_region
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint."
  value       = aws_eks_cluster.this.endpoint
}

output "vpc_id" {
  description = "EKS VPC ID."
  value       = aws_vpc.this.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by worker nodes."
  value       = values(aws_subnet.private)[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs used by load balancers."
  value       = values(aws_subnet.public)[*].id
}

output "ecr_registry" {
  description = "ECR registry used by Jenkins and Helm."
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "ecr_repository_urls" {
  description = "ECR repository URLs by repository name."
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

output "jenkins_deployer_policy_arn" {
  description = "IAM policy ARN for the Jenkins AWS principal."
  value       = aws_iam_policy.jenkins_deployer.arn
}

output "kubectl_update_command" {
  description = "Command to configure kubectl for this cluster."
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.this.name} --region ${var.aws_region}"
}

output "helm_deploy_example" {
  description = "Example Helm deployment command for the DHL app."
  value       = "helm upgrade --install dhl ../../helm/dhl --namespace dhl --create-namespace --set global.imageRegistry=${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com --set global.imageTag=latest"
}
