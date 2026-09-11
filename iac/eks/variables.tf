variable "aws_region" {
  description = "AWS region for the EKS platform."
  type        = string
  default     = "ca-central-1"
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "yemi-cluster"
}

variable "environment" {
  description = "Environment tag."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the EKS VPC."
  type        = string
  default     = "10.60.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use."
  type        = number
  default     = 2
}

variable "enable_nat_gateway" {
  description = "Create a NAT gateway so private EKS nodes can pull images and updates."
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access" {
  description = "Allow public API endpoint access for kubectl/Jenkins."
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Allow private API endpoint access inside the VPC."
  type        = bool
  default     = true
}

variable "cluster_public_access_cidrs" {
  description = "CIDRs allowed to access the public EKS API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "cluster_log_retention_days" {
  description = "CloudWatch retention period for EKS control plane logs."
  type        = number
  default     = 30
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version."
  type        = string
  default     = "1.36"
}

variable "node_ami_type" {
  description = "AMI type for the managed node group."
  type        = string
  default     = "AL2023_x86_64_STANDARD"
}

variable "node_instance_types" {
  description = "EC2 instance types for the default managed node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired node count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum node count."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum node count."
  type        = number
  default     = 4
}

variable "node_disk_size" {
  description = "Managed node root volume size in GiB."
  type        = number
  default     = 40
}

variable "ecr_repository_names" {
  description = "ECR repositories owned by this platform stack."
  type        = set(string)
  default = [
    "dhl-backend",
    "dhl-banking-service",
    "dhl-language-service",
    "dhl-price-service",
    "dhl-air-cargo-service",
    "dhl-sea-cargo-service",
    "dhl-frontend"
  ]
}

variable "ecr_image_retention_count" {
  description = "Number of recent tagged images to retain per ECR repository."
  type        = number
  default     = 30
}

variable "jenkins_deployer_role_name" {
  description = "Optional IAM role name used by Jenkins. When set, Terraform attaches the Jenkins deployer policy to it."
  type        = string
  default     = null
}

variable "jenkins_deployer_principal_arn" {
  description = "Optional IAM principal ARN used by Jenkins for kubectl/Helm access to EKS."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to platform resources."
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "dhl"
  }
}
