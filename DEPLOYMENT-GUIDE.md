# 🚀 Complete Guide: Deploy Phoenix App to AWS EKS

This guide will teach you how to deploy the Phoenix Reviews application to AWS EKS (Elastic Kubernetes Service) step by step.

---

## 📚 Table of Contents
1. [What Are We Doing?](#what-are-we-doing)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Instructions](#step-by-step-instructions)
5. [Understanding Each Component](#understanding-each-component)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 What Are We Doing?

Think of this like building and shipping a toy:
1. **Build the toy** (Docker) - Package your app into a container
2. **Ship it to the warehouse** (ECR) - Upload to AWS's storage
3. **Set up the store** (Kubernetes) - Tell AWS how to display and run it
4. **Open to customers** (LoadBalancer) - Make it accessible on the internet

---

## ✅ Prerequisites

You'll need these tools installed on your computer:

### 1. Docker Desktop
- **What it does**: Builds containers (like zip files for apps)
- **Download**: https://www.docker.com/products/docker-desktop
- **Test it works**: Open terminal and type `docker --version`

### 2. AWS CLI
- **What it does**: Talks to AWS from your computer
- **Download**: https://aws.amazon.com/cli/
- **Setup**: Run `aws configure` and enter your AWS credentials
- **Test it works**: Type `aws --version`

### 3. kubectl
- **What it does**: Controls Kubernetes clusters
- **Install**: 
  ```bash
  # For Mac
  brew install kubectl
  
  # For Windows (using Chocolatey)
  choco install kubernetes-cli
  
  # For Linux
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  ```
- **Test it works**: Type `kubectl version --client`

### 4. eksctl (optional but helpful)
- **What it does**: Makes EKS easier to work with
- **Install**: https://eksctl.io/installation/
- **Test it works**: Type `eksctl version`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              EKS Cluster                            │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │  Namespace: phoenix-app                  │     │   │
│  │  │                                           │     │   │
│  │  │  ┌────────────────────────────────┐     │     │   │
│  │  │  │  Deployment (3 Replicas)       │     │     │   │
│  │  │  │  ┌──────┐ ┌──────┐ ┌──────┐  │     │     │   │
│  │  │  │  │ Pod1 │ │ Pod2 │ │ Pod3 │  │     │     │   │
│  │  │  │  └──────┘ └──────┘ └──────┘  │     │     │   │
│  │  │  └────────────────────────────────┘     │     │   │
│  │  │                 ↑                        │     │   │
│  │  │                 │                        │     │   │
│  │  │  ┌──────────────┴──────────────┐       │     │   │
│  │  │  │  Service (LoadBalancer)      │       │     │   │
│  │  │  └──────────────┬──────────────┘       │     │   │
│  │  └─────────────────┼──────────────────────┘     │   │
│  └────────────────────┼────────────────────────────┘   │
│                       │                                 │
│  ┌────────────────────┴────────────────┐               │
│  │  AWS Load Balancer (Public IP)      │               │
│  └────────────────────┬────────────────┘               │
└─────────────────────┼──────────────────────────────────┘
                      │
                      ↓
              🌐 Internet Users
```

---

## 📋 Step-by-Step Instructions

### Phase 1: Build the Docker Image

**What we're doing**: Creating a container (think: a lunchbox) with your app inside.

1. **Open your terminal** and navigate to your project folder:
   ```bash
   cd /path/to/your/phoenix-app
   ```

2. **Build the Docker image**:
   ```bash
   docker build -t phoenix-app:v1 .
   ```
   - `docker build`: Command to create an image
   - `-t phoenix-app:v1`: Gives it a name (tag)
   - `.`: Build using files in current folder
   
   **This takes 2-5 minutes** - You'll see lots of text scrolling!

3. **Test it locally** (optional but recommended):
   ```bash
   docker run -p 8080:80 phoenix-app:v1
   ```
   - Open browser to `http://localhost:8080`
   - You should see your Phoenix app!
   - Press `Ctrl+C` to stop

---

### Phase 2: Push Image to AWS ECR

**What we're doing**: Uploading your container to AWS's storage (like uploading to Google Drive).

1. **Create an ECR repository**:
   ```bash
   aws ecr create-repository \
     --repository-name phoenix-app \
     --region us-east-1
   ```
   - Change `us-east-1` to your region if different
   - You'll see output with a `repositoryUri` - **SAVE THIS!**

2. **Log in to ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS \
     --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   ```
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Replace `us-east-1` with your region

3. **Tag your image**:
   ```bash
   docker tag phoenix-app:v1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/phoenix-app:latest
   ```

4. **Push to ECR**:
   ```bash
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/phoenix-app:latest
   ```
   **This takes 1-3 minutes** depending on your internet speed.

---

### Phase 3: Configure kubectl for Your EKS Cluster

**What we're doing**: Connecting your computer to your AWS cluster.

1. **Update kubeconfig**:
   ```bash
   aws eks update-kubeconfig \
     --region us-east-1 \
     --name your-cluster-name
   ```
   - Replace `your-cluster-name` with your actual cluster name
   - Replace `us-east-1` with your region

2. **Test connection**:
   ```bash
   kubectl get nodes
   ```
   - You should see a list of your cluster nodes!

---

### Phase 4: Update Kubernetes Configuration

**What we're doing**: Telling the YAML files where to find your Docker image.

1. **Edit `k8s/deployment.yaml`**:
   - Open the file
   - Find line: `image: YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/phoenix-app:latest`
   - Replace with your actual ECR image URL
   - Example: `image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/phoenix-app:latest`

---

### Phase 5: Deploy to EKS

**What we're doing**: Sending instructions to AWS to run your app.

1. **Create namespace** (like creating a folder):
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Create ConfigMap** (stores configuration):
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

3. **Create Deployment** (runs your app):
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

4. **Create Service** (makes it accessible):
   ```bash
   kubectl apply -f k8s/service.yaml
   ```

5. **Create HPA** (auto-scales your app):
   ```bash
   kubectl apply -f k8s/hpa.yaml
   ```

6. **Create Ingress** (optional - for custom domain):
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

---

### Phase 6: Verify Deployment

**What we're doing**: Checking if everything is working.

1. **Check pods are running**:
   ```bash
   kubectl get pods -n phoenix-app
   ```
   - You should see 3 pods with status `Running`
   - If status is `Pending` or `CrashLoopBackOff`, see troubleshooting

2. **Check service**:
   ```bash
   kubectl get service -n phoenix-app
   ```
   - Look for `EXTERNAL-IP` column
   - **Wait 2-5 minutes** if it says `<pending>`

3. **Get the LoadBalancer URL**:
   ```bash
   kubectl get service phoenix-service -n phoenix-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   ```
   - Copy this URL
   - Open in browser - **YOUR APP IS LIVE!** 🎉

---

## 🔍 Understanding Each Component

### Dockerfile
**Purpose**: Blueprint for building your container image

**Key Parts**:
- **Stage 1 (Builder)**: Compiles your React app
  - Uses Node.js to install dependencies
  - Runs `npm run build` to create optimized files
  
- **Stage 2 (Runtime)**: Serves the app
  - Uses lightweight nginx web server
  - Copies only the built files (not source code)
  - Configures nginx to handle React Router

**Why multi-stage?**: Makes image smaller (300MB → 50MB)

---

### nginx.conf
**Purpose**: Web server configuration

**Key Features**:
- Serves static files (HTML, CSS, JS)
- Handles React Router (all routes → index.html)
- Enables gzip compression (faster loading)
- Sets security headers

---

### Kubernetes Manifests

#### namespace.yaml
**Purpose**: Creates an isolated environment for your app

**Think of it like**: A separate room in a house - keeps your stuff organized and separate from other apps.

**What it does**:
- Creates `phoenix-app` namespace
- All resources go in this namespace

---

#### configmap.yaml
**Purpose**: Stores configuration (non-sensitive)

**Contains**:
- Supabase URL
- Publishable API key
- Project ID

**Why use it?**: Change config without rebuilding Docker image!

---

#### deployment.yaml
**Purpose**: Defines HOW to run your app

**Key Settings**:
- **replicas: 3** → Runs 3 copies of your app (high availability!)
- **RollingUpdate** → Updates without downtime
- **Resource limits** → Prevents one app from using all resources
- **Health checks** → Kubernetes restarts unhealthy pods automatically

**Health Checks Explained**:
- **livenessProbe**: "Is the app alive?" → Restart if not responding
- **readinessProbe**: "Is the app ready for traffic?" → Don't send requests if not ready

---

#### service.yaml
**Purpose**: Exposes your app to the internet

**Type: LoadBalancer**:
- Creates AWS Load Balancer automatically
- Distributes traffic across all 3 pods
- Provides single public IP/URL

**How it works**:
```
User → LoadBalancer → Service → Pod (random selection)
```

---

#### hpa.yaml
**Purpose**: Auto-scales based on load

**What it does**:
- Monitors CPU and memory usage
- If CPU > 70%, adds more pods
- If CPU < 70% for 5 minutes, removes pods
- Min: 2 pods, Max: 10 pods

**Example**:
- Normal traffic: 2 pods
- Black Friday sale: Scales to 8 pods automatically!
- Sale ends: Scales back down to 2 pods

---

#### ingress.yaml
**Purpose**: Advanced traffic routing (optional)

**Benefits**:
- Use custom domain (myapp.com instead of AWS URL)
- HTTPS/SSL support
- Path-based routing (/api → backend, / → frontend)

**Requires**: AWS Load Balancer Controller installed on cluster

---

## 🛠️ Troubleshooting

### Pods not starting

**Check pod logs**:
```bash
kubectl logs -n phoenix-app <pod-name>
```

**Common issues**:
- ❌ Image pull error → Check ECR image URL in deployment.yaml
- ❌ CrashLoopBackOff → Check app configuration (ConfigMap)
- ❌ Pending → Not enough cluster resources

---

### Can't access app

**Check service**:
```bash
kubectl describe service phoenix-service -n phoenix-app
```

**Common issues**:
- LoadBalancer takes 2-5 minutes to provision
- Security groups blocking traffic (check AWS console)
- Pods not ready (check pod status)

---

### Health checks failing

**Check pod details**:
```bash
kubectl describe pod -n phoenix-app <pod-name>
```

**Common fixes**:
- Increase `initialDelaySeconds` in deployment.yaml
- Check nginx is serving on port 80
- Verify app builds correctly

---

## 📊 Useful Commands

### View all resources
```bash
kubectl get all -n phoenix-app
```

### Watch pod status (live updates)
```bash
kubectl get pods -n phoenix-app --watch
```

### View pod logs
```bash
kubectl logs -n phoenix-app <pod-name> -f
```

### Execute command in pod (debugging)
```bash
kubectl exec -it -n phoenix-app <pod-name> -- /bin/sh
```

### Scale manually
```bash
kubectl scale deployment phoenix-app -n phoenix-app --replicas=5
```

### Delete everything
```bash
kubectl delete namespace phoenix-app
```

---

## 🎓 Concepts Explained (For 5-Year-Olds)

### Docker Container
**Like a lunchbox**: 
- Contains everything your app needs (food = code, utensils = dependencies)
- Can be opened anywhere (any computer)
- Keeps things separate and clean

### Kubernetes Pod
**Like a toy car**:
- Contains one or more containers
- Has wheels (resources like CPU/memory)
- Can crash and be replaced with identical copy

### Deployment
**Like a toy factory**:
- Blueprint says "make 3 red cars"
- If one breaks, factory makes a new one
- Can upgrade all cars to blue version smoothly

### Service
**Like a toy store**:
- Customers don't go to factory (pods)
- They go to store (service)
- Store knows which factory has stock (which pod is healthy)

### Load Balancer
**Like a receptionist**:
- Greets all visitors
- Sends them to available person (pod)
- If someone's busy, sends to next person

### Horizontal Pod Autoscaler
**Like hiring more workers**:
- Store is busy → Hire more cashiers
- Store is empty → Send some cashiers home
- Saves money and handles rushes

---

## 🚀 Next Steps

After successful deployment:

1. **Set up monitoring** (AWS CloudWatch)
2. **Configure custom domain** (Route 53 + Certificate Manager)
3. **Enable HTTPS** (Update ingress.yaml with certificate ARN)
4. **Set up CI/CD** (GitHub Actions to auto-deploy)
5. **Configure backups** (Database snapshots)

---

## 💡 Summary

You've successfully:
✅ Built a Docker image
✅ Pushed it to AWS ECR
✅ Deployed to EKS with 3 replicas
✅ Set up auto-scaling
✅ Exposed your app to the internet

**Your app is now production-ready!** 🎉

If you have questions, the Kubernetes documentation is excellent: https://kubernetes.io/docs/

---

**Made with ❤️ for beginners learning DevOps**
