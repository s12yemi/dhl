terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_subnet" "selected" {
  count = var.subnet_id == null ? 0 : 1
  id    = var.subnet_id
}

locals {
  ami_id                = coalesce(var.ami_id, data.aws_ami.ubuntu.id)
  private_key_path      = pathexpand(var.private_key_path)
  security_group_vpc_id = var.vpc_id != null ? var.vpc_id : (var.subnet_id != null ? data.aws_subnet.selected[0].vpc_id : null)
  security_group_ids    = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.cicd[0].id]
}

resource "aws_security_group" "cicd" {
  count       = length(var.security_group_ids) == 0 ? 1 : 0
  name_prefix = "${var.instance_name}-"
  description = "Access for SSH, Jenkins, SonarQube, and Mattermost"
  vpc_id      = local.security_group_vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "Jenkins agent"
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "SonarQube"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    description = "Mattermost"
    from_port   = 8065
    to_port     = 8065
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.instance_name}-sg"
  })
}

resource "aws_instance" "cicd" {
  ami                         = local.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = local.security_group_ids
  associate_public_ip_address = var.associate_public_ip_address

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = merge(var.tags, {
    Name = var.instance_name
  })
}

resource "terraform_data" "ansible_provision" {
  count      = var.run_ansible ? 1 : 0
  depends_on = [aws_instance.cicd]

  triggers_replace = {
    instance_id                = aws_instance.cicd.id
    playbook_sha               = filesha256("${path.module}/ansible/provision.yml")
    compose_template           = filesha256("${path.module}/ansible/templates/docker-compose.yml.j2")
    private_key_path           = local.private_key_path
    ansible_user               = var.ssh_user
    public_ip                  = aws_instance.cicd.public_ip
    jenkins_image              = var.jenkins_image
    sonarqube_image            = var.sonarqube_image
    mattermost_image           = var.mattermost_image
    postgres_image             = var.postgres_image
    mattermost_db_password_sha = nonsensitive(sha256(var.mattermost_db_password))
    mattermost_url             = "http://${aws_instance.cicd.public_dns}:8065"
    docker_users               = join(",", var.docker_users)
    privileged_users           = join(",", var.privileged_users)
    cicd_compose_dir           = var.cicd_compose_dir
  }

  provisioner "local-exec" {
    command = join(" ", [
      "ansible-playbook",
      "-i '${aws_instance.cicd.public_ip},'",
      "-u '${var.ssh_user}'",
      "--private-key '${local.private_key_path}'",
      "-e 'ansible_ssh_common_args=\"-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null\"'",
      "-e '${jsonencode({
        docker_users           = var.docker_users
        privileged_users       = var.privileged_users
        jenkins_image          = var.jenkins_image
        sonarqube_image        = var.sonarqube_image
        mattermost_image       = var.mattermost_image
        mattermost_site_url    = "http://${aws_instance.cicd.public_dns}:8065"
        postgres_image         = var.postgres_image
        mattermost_db_password = var.mattermost_db_password
        cicd_compose_dir       = var.cicd_compose_dir
      })}'",
      "'${path.module}/ansible/provision.yml'"
    ])

    environment = {
      ANSIBLE_HOST_KEY_CHECKING = "False"
    }
  }
}
