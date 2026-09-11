variable "aws_region" {
  description = "AWS region where the EC2 instance will be created."
  type        = string
  default     = "ca-central-1"
}

variable "ami_id" {
  description = "Optional Ubuntu AMI override. Leave null to use the latest Ubuntu 24.04 LTS AMI in the selected region."
  type        = string
  default     = null
}

variable "instance_name" {
  description = "Name tag for the CI/CD EC2 instance."
  type        = string
  default     = "cicd-ubuntu-t3-medium"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Existing AWS EC2 key pair name."
  type        = string
  default     = "my-MAC-key-pair"
}

variable "private_key_path" {
  description = "Local private key path used by Ansible to SSH into the instance."
  type        = string
  default     = "~/Downloads/my-MAC-key-pair.pem"
}

variable "ssh_user" {
  description = "SSH user for the selected Ubuntu AMI."
  type        = string
  default     = "ubuntu"
}

variable "subnet_id" {
  description = "Optional subnet ID. Leave null to use the AWS provider default VPC behavior."
  type        = string
  default     = null
}

variable "vpc_id" {
  description = "Optional VPC ID for the managed security group. Leave null for the default VPC."
  type        = string
  default     = null
}

variable "security_group_ids" {
  description = "Existing security group IDs. When provided, Terraform will not create a new security group."
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to reach SSH, Jenkins, and SonarQube."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "associate_public_ip_address" {
  description = "Whether to associate a public IP address with the instance."
  type        = bool
  default     = true
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB."
  type        = number
  default     = 40
}

variable "run_ansible" {
  description = "Run the Ansible provisioner after the EC2 instance is created."
  type        = bool
  default     = true
}

variable "docker_users" {
  description = "Users added to the docker group on the instance."
  type        = list(string)
  default     = ["ubuntu"]
}

variable "privileged_users" {
  description = "Users granted passwordless sudo on the instance."
  type        = list(string)
  default     = ["ubuntu"]
}

variable "jenkins_image" {
  description = "Jenkins container image."
  type        = string
  default     = "jenkins/jenkins:lts-jdk17"
}

variable "sonarqube_image" {
  description = "SonarQube container image."
  type        = string
  default     = "sonarqube:community"
}

variable "mattermost_image" {
  description = "Mattermost container image."
  type        = string
  default     = "mattermost/mattermost-team-edition:latest"
}

variable "postgres_image" {
  description = "PostgreSQL image used by Mattermost."
  type        = string
  default     = "postgres:16-alpine"
}

variable "mattermost_db_password" {
  description = "Password for the Mattermost PostgreSQL user. Change this in terraform.tfvars before applying."
  type        = string
  default     = "change-this-mattermost-password"
  sensitive   = true
}

variable "cicd_compose_dir" {
  description = "Remote directory where the CI/CD compose file is managed."
  type        = string
  default     = "/opt/cicd"
}

variable "tags" {
  description = "Tags applied to created AWS resources."
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "dhl"
  }
}
