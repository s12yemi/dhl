pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        SONARQUBE_SERVER_ENV  = 'sonarqubeserver'
        AWS_CREDENTIALS_ID    = 'aws-creds'
        AWS_REGION            = 'ca-central-1'
        EKS_CLUSTER_NAME      = 'yemi-cluster'
        GIT_REPO_URL          = 'https://github.com/s12yemi/dhl.git'
        GIT_BRANCH            = 'master'
        ECR_REPOSITORY_PREFIX = 'dhl'
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
        HELM_RELEASE          = 'dhl'
        HELM_CHART            = 'helm/dhl'
        K8S_NAMESPACE         = 'dhl'
        ALERT_EMAIL           = 's12yemi.wft@gmail.com'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO_URL}"
            }
        }

        stage('Environment Setup') {
            steps {
                echo 'Checking workspace and tools'
                sh 'node --version'
                sh 'npm --version'
                sh 'aws --version'
                sh 'docker --version'
                sh 'helm version --short'
            }
        }

        stage('Login to AWS ECR') {
            steps {
                script {
                    withAWS(credentials: "${env.AWS_CREDENTIALS_ID}", region: "${env.AWS_REGION}") {
                        env.AWS_ACCOUNT_ID = sh(
                            script: 'aws sts get-caller-identity --query Account --output text',
                            returnStdout: true
                        ).trim()
                        env.ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"

                        sh """
                            aws ecr get-login-password --region ${env.AWS_REGION} \
                                | docker login --username AWS --password-stdin ${env.ECR_REGISTRY}
                        """

                        def services = [
                            'backend',
                            'banking-service',
                            'language-service',
                            'price-service',
                            'air-cargo-service',
                            'sea-cargo-service',
                            'frontend'
                        ]

                        services.each { service ->
                            sh """
                                aws ecr describe-repositories \
                                    --repository-names ${env.ECR_REPOSITORY_PREFIX}-${service} \
                                    --region ${env.AWS_REGION} >/dev/null
                            """
                        }
                    }
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    mkdir -p trivy-reports

                    SERVICES="backend frontend banking-service language-service price-service air-cargo-service sea-cargo-service"

                    for service in $SERVICES
                    do
                        echo "Scanning $service..."
                        trivy fs \
                            --scanners vuln,secret,misconfig \
                            --severity HIGH,CRITICAL \
                            --format table \
                            --output trivy-reports/${service}-fs.txt \
                            ./$service
                    done
                '''
            }
        }

        stage('Build & Publish ECR Images') {
            steps {
                script {
                    def services = [
                        backend: [context: 'backend', dockerfile: 'backend/Dockerfile'],
                        'banking-service': [context: 'banking-service', dockerfile: 'banking-service/Dockerfile'],
                        'language-service': [context: 'language-service', dockerfile: 'language-service/Dockerfile'],
                        'price-service': [context: 'price-service', dockerfile: 'price-service/Dockerfile'],
                        'air-cargo-service': [context: 'air-cargo-service', dockerfile: 'air-cargo-service/Dockerfile'],
                        'sea-cargo-service': [context: 'sea-cargo-service', dockerfile: 'sea-cargo-service/Dockerfile'],
                        frontend: [context: 'frontend', dockerfile: 'frontend/Dockerfile']
                    ]

                    def builds = services.collectEntries { service, config ->
                        ["Build ${service}": {
                            def image = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY_PREFIX}-${service}"

                            sh "docker build -t ${image}:${env.IMAGE_TAG} -f ${config.dockerfile} ./${config.context}"
                            sh "docker tag ${image}:${env.IMAGE_TAG} ${image}:latest"
                            sh "docker push ${image}:${env.IMAGE_TAG}"
                            sh "docker push ${image}:latest"
                        }]
                    }

                    parallel builds
                }
            }
        }

        stage('Deploy to EKS with Helm') {
            steps {
                script {
                    withAWS(credentials: "${env.AWS_CREDENTIALS_ID}", region: "${env.AWS_REGION}") {
                        sh "aws eks update-kubeconfig --name ${env.EKS_CLUSTER_NAME} --region ${env.AWS_REGION}"

                        sh """
                            helm upgrade --install ${env.HELM_RELEASE} ${env.HELM_CHART} \
                                --namespace ${env.K8S_NAMESPACE} \
                                --create-namespace \
                                --set global.imageRegistry=${env.ECR_REGISTRY} \
                                --set global.imageTag=${env.IMAGE_TAG}
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            mail(
                to: "${env.ALERT_EMAIL}",
                subject: "DHL Pipeline Passed: #${env.BUILD_NUMBER}",
                body: "DHL pipeline #${env.BUILD_NUMBER} passed and deployed to ${env.EKS_CLUSTER_NAME} in ${env.AWS_REGION}."
            )
            // mattermostSend message: "DHL pipeline #${env.BUILD_NUMBER} passed."
        }

        failure {
            mail(
                to: "${env.ALERT_EMAIL}",
                subject: "DHL Pipeline Failed: #${env.BUILD_NUMBER}",
                body: "DHL pipeline #${env.BUILD_NUMBER} failed. Check Jenkins logs for details: ${env.BUILD_URL}"
            )
            // mattermostSend message: "DHL pipeline #${env.BUILD_NUMBER} failed. ${env.BUILD_URL}"
        }
    }
}
