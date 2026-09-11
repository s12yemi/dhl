# CI/CD Infrastructure as Code

This replaces the old EC2 shell script and `user_data.sh` with a Terraform plus Ansible workflow.

For the EKS application platform, use the separate Terraform stack in `iac/eks`.

- Terraform creates the Ubuntu `t3.medium` EC2 instance and security group.
- Ansible installs Docker, upgrades Ubuntu packages, grants sudo/docker privileges, and runs Jenkins, SonarQube, and Mattermost containers.
- `terraform apply` can run both steps together when `run_ansible = true`.

## Prerequisites

- AWS credentials configured for Terraform.
- Terraform `>= 1.5`.
- Ansible installed locally.
- An existing AWS EC2 key pair and matching local private key.

## Run

```sh
cd iac
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

After apply completes, Terraform prints the SSH command plus Jenkins, SonarQube, and Mattermost URLs.

## Notes

If you provide `security_group_ids`, Terraform will use those instead of creating a security group. Make sure the selected group allows inbound `22`, `8080`, `50000`, `8065`, and `9000`.

For safer access, replace `allowed_cidr_blocks = ["0.0.0.0/0"]` with your public IP in CIDR form.

The Jenkins pipeline deploys the application chart from `helm/dhl` to EKS cluster `yemi-cluster` in `ca-central-1`.

## IaC Stacks

- `iac/`: CI/CD server stack for Jenkins, SonarQube, and Mattermost.
- `iac/eks`: EKS platform stack for VPC, EKS, managed nodes, ECR repositories, IAM, and cluster add-ons.

Run the platform stack before running the application Jenkins pipeline.
