data "aws_iam_policy_document" "jenkins_deployer" {
  statement {
    sid = "AllowEcrLogin"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid = "AllowPushToDhlRepositories"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    resources = [
      for repo in aws_ecr_repository.services : repo.arn
    ]
  }

  statement {
    sid = "AllowEksDiscovery"
    actions = [
      "eks:DescribeCluster"
    ]
    resources = [
      aws_eks_cluster.this.arn
    ]
  }
}

resource "aws_iam_policy" "jenkins_deployer" {
  name        = "${var.cluster_name}-jenkins-deployer"
  description = "Allows Jenkins to push DHL images to ECR and discover the EKS cluster."
  policy      = data.aws_iam_policy_document.jenkins_deployer.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "jenkins_deployer" {
  count = var.jenkins_deployer_role_name == null ? 0 : 1

  role       = var.jenkins_deployer_role_name
  policy_arn = aws_iam_policy.jenkins_deployer.arn
}

resource "aws_eks_access_entry" "jenkins_deployer" {
  count = var.jenkins_deployer_principal_arn == null ? 0 : 1

  cluster_name  = aws_eks_cluster.this.name
  principal_arn = var.jenkins_deployer_principal_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "jenkins_deployer" {
  count = var.jenkins_deployer_principal_arn == null ? 0 : 1

  cluster_name  = aws_eks_cluster.this.name
  principal_arn = var.jenkins_deployer_principal_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.jenkins_deployer]
}
