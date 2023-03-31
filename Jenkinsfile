pipeline {
  agent {
        kubernetes {
            label 'dind'
            defaultContainer 'docker'
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins
spec:
  containers:
    - name: jnlp
      image: jenkins/inbound-agent
    - name: docker
      image: docker:latest
      command:
        - /bin/cat
      readinessProbe:
        exec:
          command:
            - sh
            - "-c"
            - "docker ps >/dev/null 2>&1"
        initialDelaySeconds: 5
        periodSeconds: 10
        timeoutSeconds: 1
      tty: true
      env:
        - name: DOCKER_HOST
          value: tcp://localhost:2375
    - name: dind
      image: docker:dind
      securityContext:
        privileged: true
      env:
        - name: DOCKER_TLS_CERTDIR
          value: ""
      readinessProbe:
        exec:
          command:
            - sh
            - "-c"
            - "docker ps >/dev/null 2>&1"
        initialDelaySeconds: 5
        periodSeconds: 10
        timeoutSeconds: 1
    - name: helm
      image: alpine/helm:latest
      command:
        - /bin/cat
      tty: true
  volumes:
    - name: dind-storage
      emptyDir: {}
            '''
        }
    }

  stages {
    stage('Generate Image Tag') {
      steps {
        script {
          env.IMAGE_TAG = "${env.BUILD_NUMBER}"
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build -t studentcode/studentcode-be:${env.IMAGE_TAG} ."
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'cc8463c8-f169-4079-852d-89fec3e6dbac', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh "docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD"
        }
        sh "docker push studentcode/studentcode-be:${env.IMAGE_TAG}"
      }
    }

    stage('Update Helm Chart Values') {
      steps {
        sh "sed -i \"s|tag: latest|tag: ${env.IMAGE_TAG}|\" ./helm-chart/values.yaml"

        sh "cat ./helm-chart/values.yaml" // This line will print the contents of the values.yaml file
      }
    }

    stage("Upgrade Application using Helm Chart") {
      steps {
        container('helm') {
          withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
            // sh "helm delete studentcode-be-helm-chart --kubeconfig $KUBECONFIG"
            sh "helm upgrade studentcode-be-helm-chart ./helm-chart -f ./helm-chart/values.yaml --kubeconfig $KUBECONFIG"
          }
        }
      }
    }
    /* stage('Upgrade Application using Helm Chart') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'helm upgrade studentcode-be-helm-chart helm-chart -f values.yaml --kubeconfig $KUBECONFIG'
        }
      }
    } */

    /* stage('Run Tests') {
      steps {
        sh 'npm install'
        sh 'npm test'
      }
    } */
  }
}