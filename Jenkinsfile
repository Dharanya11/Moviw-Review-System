pipeline {
    agent any

    stages {

        stage('Clone Code') {
            steps {
                git 'https://github.com/Dharanya11/Moviw-Review-System.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install --prefix backend'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t movie-review-app .'
            }
        }

        stage('Run Docker Container') {
            steps {
                sh 'docker run -d -p 3000:3000 movie-review-app'
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker system prune -f'
            }
        }
    }
}