#!/usr/bin/env bash
set -e

# Create necessary labels
labels=(jenkins kubernetes ansible terraform docker devops security bug enhancement P0 P1 P2)
echo "Ensuring GitHub labels exist..."
for l in "${labels[@]}"; do
  gh label create "$l" --force >/dev/null 2>&1 || true
done

echo "Creating Tool-Specific DevOps Issues..."

# 1. DOCKER: Optimize Dockerfiles for production security and size
echo "Creating Issue 1: [Docker] Optimize Microservices Dockerfiles"
gh issue create --title "[Docker] Optimize microservice Dockerfiles for security and size" \
  --label "docker" --label "security" --label "P1" \
  --body $'## Description
The current Dockerfiles for the microservices are basic and use generic/latest base images. They need to be optimized for production security (running as non-root users, using official lightweight/alpine/distroless bases) and optimized for build caching.

## Acceptance Criteria
- Refactor Dockerfiles for all microservices (backend, frontend, banking, language, price, air-cargo, sea-cargo) to use specific, pinned lightweight base tags (e.g., `node:20-alpine`).
- Use multi-stage Docker builds where applicable (e.g., building React static assets in frontend, then serving them via Nginx).
- Ensure containers do not run as the root user (`USER node` or dedicated system user).
- Leverage Docker layer caching by copying `package.json` and installing dependencies before copying the rest of the source code.'

# 2. DOCKER: Enhance Docker Compose for Local Development Environments
echo "Creating Issue 2: [Docker] Standardize Local Docker Compose Environment"
gh issue create --title "[Docker] Standardize local development environment with Docker Compose" \
  --label "docker" --label "enhancement" --label "P2" \
  --body $'## Description
Standardize the `docker-compose.yml` to support local development configurations, hot-reloading for developers, and persistent volume handling.

## Acceptance Criteria
- Configure volume mounts in `docker-compose.yml` to support hot-reloading for developers (mounting local source code into containers).
- Add healthchecks to dependency services (like MongoDB) and use `depends_on` with `condition: service_healthy` to ensure services start in the correct order.
- Define a unified `.env` template file for local environment configurations.'

# 3. JENKINS: Create Declarative Multi-Stage Jenkinsfile Pipeline
echo "Creating Issue 3: [Jenkins] Implement Declarative Jenkinsfile CI/CD Pipeline"
gh issue create --title "[Jenkins] Implement declarative Jenkinsfile CI/CD pipeline" \
  --label "jenkins" --label "devops" --label "P0" \
  --body $'## Description
Replace/supplement the current GitHub Actions pipeline with a multi-stage Jenkins Declarative Pipeline (`Jenkinsfile`) to automate testing, building, and pushing microservices.

## Acceptance Criteria
- Create a `Jenkinsfile` at the root of the project.
- Implement parallel build stages to build and push Docker images for all microservices simultaneously.
- Integrate SonarQube/Linter steps to scan backend and frontend code.
- Add notification stages (e.g., Slack alerts on build success/failure).'

# 4. TERRAFORM: Infrastructure as Code for Cloud Kubernetes Cluster
echo "Creating Issue 4: [Terraform] Provision Kubernetes Cluster (EKS/GKE)"
gh issue create --title "[Terraform] Provision managed Kubernetes cluster using Terraform" \
  --label "terraform" --label "kubernetes" --label "P0" \
  --body $'## Description
Define the infrastructure of our deployment environment using Terraform IaC (Infrastructure as Code) to provision a managed Kubernetes cluster (AWS EKS or GCP GKE) and its network requirements.

## Acceptance Criteria
- Create Terraform configuration files inside a new `/terraform` directory.
- Define VPC, subnets, internet gateways, and security groups required for the cluster.
- Provision a managed Kubernetes cluster (EKS/GKE) with auto-scaling node groups.
- Set up remote state storage (e.g., AWS S3 + DynamoDB lock) to allow team collaboration.'

# 5. TERRAFORM: Manage External Databases and Cache Services
echo "Creating Issue 5: [Terraform] Provision Managed Database Resources"
gh issue create --title "[Terraform] Provision managed MongoDB cluster using Terraform" \
  --label "terraform" --label "P1" \
  --body $'## Description
Instead of running MongoDB inside our Kubernetes cluster using a standard deployment for production, we want to provision managed MongoDB databases (e.g., MongoDB Atlas or AWS DocumentDB) using Terraform.

## Acceptance Criteria
- Write Terraform manifests to provision a highly-available MongoDB cluster.
- Expose connection secrets and credentials dynamically using cloud secret stores (AWS Secrets Manager or GCP Secret Manager).
- Link network security groups/firewall rules to allow connection only from the K8s node groups.'

# 6. ANSIBLE: Configure Runner and Deployment Nodes
echo "Creating Issue 6: [Ansible] Configure Build and Jenkins Runner Node Environments"
gh issue create --title "[Ansible] Automate build runner server configuration with Ansible" \
  --label "ansible" --label "P1" \
  --body $'## Description
Create Ansible playbooks to automate the provisioning, package installation, and security patching of our Jenkins build runners and self-hosted worker nodes.

## Acceptance Criteria
- Write playbooks/roles to install Docker, Git, Node, Java, and the Jenkins runner client on target nodes.
- Enforce basic security hardening (disabling root login, configuring UFW firewall, setting up fail2ban).
- Maintain host inventories cleanly for development, staging, and production environments.'

# 7. ANSIBLE: Configure Kubernetes Cluster Secrets and Namespace Setup
echo "Creating Issue 7: [Ansible] Automate Kubernetes Cluster Bootstrap and Namespace Setup"
gh issue create --title "[Ansible] Bootstrap Kubernetes namespaces, secrets, and context configurations" \
  --label "ansible" --label "kubernetes" --label "P2" \
  --body $'## Description
Write Ansible playbooks using the `kubernetes.core.k8s` module to bootstrap the Kubernetes cluster namespace, create default service accounts, and dynamically populate Kubernetes Secrets from local secure variables.

## Acceptance Criteria
- Playbook must create namespaces (`dev`, `staging`, `prod`).
- Inject required secrets (e.g. database credentials, JWT secrets) securely into target namespaces.
- Set up default network policies for namespace isolation.'

# 8. KUBERNETES: Refactor Manifests into Helm Charts
echo "Creating Issue 8: [Kubernetes] Convert Raw Manifests to Helm Charts"
gh issue create --title "[Kubernetes] Refactor raw Kubernetes manifests into a modular Helm Chart" \
  --label "kubernetes" --label "P1" \
  --body $'## Description
To simplify microservice orchestration and enable multi-environment configuration management, convert all raw files in `k8s/` into a single, modular Helm Chart or a collection of sub-charts.

## Acceptance Criteria
- Create a Helm structure (`/helm/dhl-app`) containing templates for all microservices.
- Consolidate standard parameters (replica counts, image tags, ports, ingress hosts) into a global `values.yaml` file.
- Provide custom value files (`values-dev.yaml`, `values-prod.yaml`) for environment differences.'

# 9. KUBERNETES: Add Probes, Resource Limits, and Pod Security
echo "Creating Issue 9: [Kubernetes] Add Resource Limits and Probes to Deployments"
gh issue create --title "[Kubernetes] Implement health probes and resource boundaries on all deployments" \
  --label "kubernetes" --label "bug" --label "P0" \
  --body $'## Description
The current Kubernetes deployment files are missing resource allocations and health checks. This can lead to resource starvation, node instability, and unresponsive containers remaining in routing paths.

## Acceptance Criteria
- Define `livenessProbe` and `readinessProbe` for all microservice deployment manifests.
- Specify CPU/Memory requests and limits (`resources.limits` and `resources.requests`) for every container template.
- Enforce Pod Security Standards (e.g. `readOnlyRootFilesystem: true`, `runAsNonRoot: true`, `allowPrivilegeEscalation: false`).'

# 10. KUBERNETES: Ingress Controller Routing and SSL/TLS Configuration
echo "Creating Issue 10: [Kubernetes] Implement Nginx Ingress and SSL Certificate Routing"
gh issue create --title "[Kubernetes] Configure Nginx Ingress Controller with SSL/TLS termination" \
  --label "kubernetes" --label "security" --label "P1" \
  --body $'## Description
Deploy and configure an Nginx Ingress Controller inside the cluster to handle routing to our frontend and backend APIs, and configure Let\'s Encrypt TLS certificates using Cert-Manager for HTTPS termination.

## Acceptance Criteria
- Create an Ingress resource routing public domains to `frontend-service` and `/api/*` requests to `backend-service`.
- Integrate `cert-manager` annotations to automatically issue and renew Let\'s Encrypt SSL certificates.
- Enforce automatic HTTP to HTTPS redirection.'

echo "All tool-specific DevOps issues created successfully!"
