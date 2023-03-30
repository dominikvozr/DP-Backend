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
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t studentcode/studentcode-be .'
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'cc8463c8-f169-4079-852d-89fec3e6dbac', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
        }
        sh 'docker push studentcode/studentcode-be'
      }
    }

    stage("Upgrade Application using Helm Chart") {
      steps {
        container('helm') {
          withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
            sh "helm upgrade studentcode-be-helm-chart -f ./helm-chart/values.yaml --kubeconfig $KUBECONFIG"
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