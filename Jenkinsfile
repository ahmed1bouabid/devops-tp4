// Pipeline Jenkins du TP4 (repris du Jenkinsfile du dépôt de l'enseignante)
// Adapté pour macOS : "sh" au lieu de "bat", dossiers Server et Client avec majuscule
pipeline {
    agent any

    // Vérifier le dépôt GitHub toutes les 5 minutes
    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        // ID des credentials Docker Hub (Jenkins > Credentials), créé au TP3
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-creds'

        // Noms des images sur Docker Hub
        IMAGE_NAME_SERVER = 'ahmedbouabid/mern-server'
        IMAGE_NAME_CLIENT = 'ahmedbouabid/mern-client'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Server Image') {
            steps {
                dir('Server') {
                    sh 'docker build -t $IMAGE_NAME_SERVER:latest .'
                }
            }
        }

        stage('Build Client Image') {
            steps {
                dir('Client') {
                    sh 'docker build -t $IMAGE_NAME_CLIENT:latest .'
                }
            }
        }

        stage('Scan Server Image') {
            steps {
                // Trivy cherche les failles de sécurité connues dans l'image
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --scanners vuln --exit-code 0 --severity LOW,MEDIUM,HIGH,CRITICAL $IMAGE_NAME_SERVER:latest'
            }
        }

        stage('Scan Client Image') {
            steps {
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --scanners vuln --exit-code 0 --severity LOW,MEDIUM,HIGH,CRITICAL $IMAGE_NAME_CLIENT:latest'
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS_ID}",
                                                  usernameVariable: 'USER',
                                                  passwordVariable: 'PASS')]) {
                    sh '''
                        echo "$PASS" | docker login -u "$USER" --password-stdin
                        docker push $IMAGE_NAME_SERVER:latest
                        docker push $IMAGE_NAME_CLIENT:latest
                    '''
                }
            }
        }
    }

    post {
        success { echo 'Build, scan et push OK' }
        failure { echo 'Erreur dans le pipeline' }
    }
}
