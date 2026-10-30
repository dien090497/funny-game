pipeline {
    agent {
        docker {
            image 'maven:3.9-eclipse-temurin-21'
            args '-v $HOME/.m2:/root/.m2'  // cache Maven deps giữa các build
        }
    }

    environment {
        APP_NAME    = 'funny-game'
        ECR_REPO    = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/${APP_NAME}"
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Build JAR') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Build Docker Image') {
            agent any  // chạy trên Jenkins host, không phải Maven container
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ."
                sh "docker tag  ${ECR_REPO}:${IMAGE_TAG} ${ECR_REPO}:latest"
            }
        }

        stage('Push to ECR') {
            agent any
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-ecr-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh """
                        aws ecr get-login-password --region ${env.AWS_REGION} \
                          | docker login --username AWS --password-stdin ${ECR_REPO}
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy to EC2') {
            agent any
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'ec2-ssh-key',
                    keyFileVariable: 'SSH_KEY'
                )]) {
                    sh """
                        ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${env.EC2_HOST} '
                            aws ecr get-login-password --region ${env.AWS_REGION} \
                              | docker login --username AWS --password-stdin ${ECR_REPO}
                            docker pull ${ECR_REPO}:latest
                            docker stop ${APP_NAME} || true
                            docker rm   ${APP_NAME} || true
                            docker run -d \\
                                --name ${APP_NAME} \\
                                --restart unless-stopped \\
                                -p 8080:8080 \\
                                -e DATABASE_URL=\$DATABASE_URL \\
                                -e DATABASE_USERNAME=\$DATABASE_USERNAME \\
                                -e DATABASE_PASSWORD=\$DATABASE_PASSWORD \\
                                ${ECR_REPO}:latest
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deploy thành công — build #${env.BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline thất bại — build #${env.BUILD_NUMBER}"
            // Thêm email/Slack notification ở đây nếu cần
        }
        always {
            // Dọn image cũ trên Jenkins host
            sh "docker image prune -f || true"
        }
    }
}
