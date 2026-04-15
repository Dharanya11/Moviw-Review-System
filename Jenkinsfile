pipeline {
    agent any

    stages {

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t movie-review-app .'
            }
        }

stage('Run Docker Container') {
    steps {
        bat 'docker stop movie || exit 0'
        bat 'docker rm movie || exit 0'
        bat 'docker run -d -p 3001:3000 --name movie movie-review-app'
    }
}
    }
}