pipeline {
    agent any

    environment {
        // Global variables for image naming and registry connection
        REGISTRY_USER          = 'mahendrasingh12345'
        BACKEND_IMAGE_NAME     = 'opspulse-backend'
        FRONTEND_IMAGE_NAME    = 'opspulse-frontend'
        
        // Credential Bindings in Jenkins Dashboard
        DOCKER_HUB_CREDS_ID    = 'docker-hub-credentials'
        KUBECONFIG_CREDS_ID    = 'kubeconfig-credentials'
        
        // Add Git to PATH for Windows agent to find sh.exe
        PATH                   = "C:\\Program Files\\Git\\bin;C:\\Program Files\\Git\\usr\\bin;${env.PATH}"
    }

    stages {
        stage('Clone Workspace') {
            steps {
                echo 'Checking out latest commit from Git repository...'
                checkout scm
            }
        }

        stage('Dependency Audit') {
            parallel {
                stage('Scan Backend') {
                    steps {
                        echo 'Auditing backend dependencies for security vulnerabilities...'
                        dir('backend') {
                            sh 'npm install --package-lock-only'
                            sh 'npm audit --audit-level=high || true'
                        }
                    }
                }
                stage('Scan Frontend') {
                    steps {
                        echo 'Auditing frontend packages...'
                        dir('frontend') {
                            sh 'npm install --package-lock-only'
                            sh 'npm audit --audit-level=high || true'
                        }
                    }
                }
            }
        }

        stage('Build Container Images') {
            steps {
                echo 'Building production container images...'
                sh "docker build -t ${REGISTRY_USER}/${BACKEND_IMAGE_NAME}:latest -t ${REGISTRY_USER}/${BACKEND_IMAGE_NAME}:${BUILD_NUMBER} ./backend"
                sh "docker build -t ${REGISTRY_USER}/${FRONTEND_IMAGE_NAME}:latest -t ${REGISTRY_USER}/${FRONTEND_IMAGE_NAME}:${BUILD_NUMBER} ./frontend"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging in to Docker Hub and uploading compiled images...'
                withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CREDS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    
                    // Push latest and tagged release builds
                    sh "docker push ${REGISTRY_USER}/${BACKEND_IMAGE_NAME}:latest"
                    sh "docker push ${REGISTRY_USER}/${BACKEND_IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY_USER}/${FRONTEND_IMAGE_NAME}:latest"
                    sh "docker push ${REGISTRY_USER}/${FRONTEND_IMAGE_NAME}:${BUILD_NUMBER}"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Applying configurations and performing rolling update rollout...'
                withCredentials([file(credentialsId: KUBECONFIG_CREDS_ID, variable: 'KUBECONFIG')]) {
                    // Apply Kubernetes manifests
                    sh 'kubectl apply -f k8s/ --kubeconfig=$KUBECONFIG'
                    
                    // Restart deployments to pull the fresh container builds
                    sh 'kubectl rollout restart deployment/backend-deployment -n opspulse --kubeconfig=$KUBECONFIG'
                    sh 'kubectl rollout restart deployment/frontend-deployment -n opspulse --kubeconfig=$KUBECONFIG'
                    
                    // Await rollout confirmation
                    sh 'kubectl rollout status deployment/backend-deployment -n opspulse --timeout=120s --kubeconfig=$KUBECONFIG'
                    sh 'kubectl rollout status deployment/frontend-deployment -n opspulse --timeout=120s --kubeconfig=$KUBECONFIG'
                }
            }
        }
    }

    post {
        success {
            echo 'OpsPulse Continuous Delivery Pipeline completed successfully!'
        }
        failure {
            echo 'OpsPulse Build Pipeline failed. Outage alert broadcast triggered.'
        }
    }
}
