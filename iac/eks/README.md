# EKS Platform

This stack is the source of truth for the DHL Kubernetes platform:

- VPC, public subnets, private subnets, internet gateway, and NAT gateway
- EKS cluster `yemi-cluster`
- Managed node group on private subnets
- ECR repositories for all application services
- Jenkins deployer IAM policy and optional EKS access entry
- EKS add-ons: VPC CNI, kube-proxy, CoreDNS, and EBS CSI driver

The default Kubernetes version is `1.36`, with AL2023 managed nodes.

## Run

```sh
cd iac/eks
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Then configure kubectl:

```sh
aws eks update-kubeconfig --name yemi-cluster --region ca-central-1
```

The Jenkins application pipeline expects this stack to exist before it runs. Jenkins builds images, pushes to the ECR repositories created here, and deploys `helm/dhl`.

To let Terraform manage Jenkins access, set these in `terraform.tfvars` to match the IAM role or principal behind the Jenkins `aws-creds` credential:

```hcl
jenkins_deployer_role_name     = "jenkins-deployer-role"
jenkins_deployer_principal_arn = "arn:aws:iam::123456789012:role/jenkins-deployer-role"
```

## Remote State

For shared/team use, copy `backend.tf.example` to `backend.tf` after creating the S3 state bucket and DynamoDB lock table. Do not commit local `terraform.tfvars` or state files.
