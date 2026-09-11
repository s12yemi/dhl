output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.cicd.id
}

output "public_ip" {
  description = "Public IP address for SSH and service access."
  value       = aws_instance.cicd.public_ip
}

output "public_dns" {
  description = "Public DNS name for the EC2 instance."
  value       = aws_instance.cicd.public_dns
}

output "ssh_command" {
  description = "SSH command for the provisioned EC2 instance."
  value       = "ssh -i ${pathexpand(var.private_key_path)} ${var.ssh_user}@${aws_instance.cicd.public_dns}"
}

output "jenkins_url" {
  description = "Jenkins URL."
  value       = "http://${aws_instance.cicd.public_dns}:8080"
}

output "sonarqube_url" {
  description = "SonarQube URL."
  value       = "http://${aws_instance.cicd.public_dns}:9000"
}

output "mattermost_url" {
  description = "Mattermost URL."
  value       = "http://${aws_instance.cicd.public_dns}:8065"
}
