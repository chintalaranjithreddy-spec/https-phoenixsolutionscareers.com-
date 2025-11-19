# 🚀 COMPLETE EKS DEPLOYMENT GUIDE - Task Manager App

## 📥 STEP 0: DOWNLOAD ALL FILES

**You need to download this ENTIRE project folder to your computer.**

### Option A: Using Git (Recommended)
```bash
# If you have GitHub connected to Lovable:
git clone YOUR_GITHUB_REPO_URL
cd YOUR_PROJECT_FOLDER
```

### Option B: Manual Download from Lovable
1. Click **"Dev Mode"** (top left toggle)
2. You'll see all files on the left sidebar
3. Right-click project name → Download project (if available)
4. OR manually copy each file listed below

### Files You Need:
```
📦 Your Project Folder
├── 📄 Dockerfile
├── 📄 docker-compose.yml
├── 📄 nginx.conf
├── 📄 .dockerignore
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 tsconfig.json
├── 📄 vite.config.ts
├── 📄 tailwind.config.ts
├── 📄 index.html
├── 📁 k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── ingress.yaml
├── 📁 src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── (all other src files)
└── 📁 public/
    └── (all public files)
```

---

## 🛠️ STEP 1: INSTALL REQUIRED TOOLS

### 1.1 Install Docker Desktop
**What it does**: Packages your app into containers

- **Download**: https://www.docker.com/products/docker-desktop
- **Install**: Run the installer, restart computer if needed
- **Test**: Open terminal and type:
  ```bash
  docker --version
  ```
  You should see: `Docker version 24.x.x`

### 1.2 Install AWS CLI
**What it does**: Lets you control AWS from your computer

- **Download**: https://aws.amazon.com/cli/
- **Install**: Follow the installer
- **Configure**: Open terminal and run:
  ```bash
  aws configure
  ```
  Enter:
  - **AWS Access Key ID**: (from AWS Console → IAM)
  - **AWS Secret Access Key**: (from AWS Console → IAM)
  - **Region**: `us-east-1` (or your preferred region)
  - **Output format**: `json`

- **Test**: Type:
  ```bash
  aws --version
  ```
  You should see: `aws-cli/2.x.x`

### 1.3 Install kubectl
**What it does**: Controls Kubernetes clusters

**Mac (using Homebrew)**:
```bash
brew install kubectl
```

**Windows (using Chocolatey)**:
```bash
choco install kubernetes-cli
```

**Linux**:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**Test**: Type:
```bash
kubectl version --client
```

---

## 📦 STEP 2: BUILD DOCKER IMAGE LOCALLY

**Open terminal in your project folder** (where Dockerfile is located)

### 2.1 Build the Image
```bash
docker build -t task-manager:v1 .
```

**What's happening?**
- `docker build`: Creates a Docker image
- `-t task-manager:v1`: Names it "task-manager" with version "v1"
- `.`: Uses files in current directory

**This takes 3-5 minutes**. You'll see lots of output.

### 2.2 Test Locally (Optional but Recommended)
```bash
docker run -p 8080:80 task-manager:v1
```

Open browser → http://localhost:8080

You should see your Task Manager app! 🎉

Press `Ctrl+C` to stop.

---

## ☁️ STEP 3: PUSH IMAGE TO AWS ECR

### 3.1 Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name task-manager \
  --region us-east-1
```

**IMPORTANT**: Save the output! Look for `"repositoryUri"`:
```json
"repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager"
```

**Save this URL** - you'll need it multiple times!

### 3.2 Login to ECR
Replace `123456789012` with YOUR account ID:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS \
  --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

You should see: `Login Succeeded`

### 3.3 Tag Your Image
Replace with your ECR URL:
```bash
docker tag task-manager:v1 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:latest
```

### 3.4 Push to ECR
```bash
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:latest
```

**This takes 2-5 minutes** depending on internet speed.

---

## 🎯 STEP 4: CREATE DATABASE TABLE

Your Task Manager needs a database table. Run this migration:

```sql
-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations" ON public.tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Run this in your Lovable Cloud console** or Supabase SQL editor.

---

## ⚙️ STEP 5: CONFIGURE KUBERNETES FILES

### 5.1 Update k8s/configmap.yaml
Replace with YOUR Supabase credentials:
```yaml
data:
  VITE_SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
  VITE_SUPABASE_PUBLISHABLE_KEY: "your-anon-key-here"
  VITE_SUPABASE_PROJECT_ID: "your-project-id"
```

### 5.2 Update k8s/deployment.yaml
Find line with `image:` (around line 28) and replace:
```yaml
image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:latest
```

**Use YOUR ECR URL from Step 3.1!**

---

## 🔗 STEP 6: CONNECT TO YOUR EKS CLUSTER

### 6.1 Update kubeconfig
Replace with your cluster name and region:
```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name your-cluster-name
```

### 6.2 Verify Connection
```bash
kubectl get nodes
```

You should see your cluster nodes listed:
```
NAME                         STATUS   ROLES    AGE   VERSION
ip-10-0-1-123.ec2.internal   Ready    <none>   5d    v1.28.0
ip-10-0-2-456.ec2.internal   Ready    <none>   5d    v1.28.0
```

---

## 🚀 STEP 7: DEPLOY TO EKS

### 7.1 Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```
Output: `namespace/phoenix-app created`

### 7.2 Create ConfigMap
```bash
kubectl apply -f k8s/configmap.yaml
```
Output: `configmap/phoenix-config created`

### 7.3 Create Deployment
```bash
kubectl apply -f k8s/deployment.yaml
```
Output: `deployment.apps/phoenix-app created`

### 7.4 Create Service
```bash
kubectl apply -f k8s/service.yaml
```
Output: `service/phoenix-service created`

### 7.5 Create HPA (Auto-scaling)
```bash
kubectl apply -f k8s/hpa.yaml
```
Output: `horizontalpodautoscaler.autoscaling/phoenix-hpa created`

### 7.6 Create Ingress (Optional)
```bash
kubectl apply -f k8s/ingress.yaml
```

---

## ✅ STEP 8: VERIFY DEPLOYMENT

### 8.1 Check Pods
```bash
kubectl get pods -n phoenix-app
```

Expected output:
```
NAME                           READY   STATUS    RESTARTS   AGE
phoenix-app-7d4c8f9b6-abc12    1/1     Running   0          2m
phoenix-app-7d4c8f9b6-def34    1/1     Running   0          2m
phoenix-app-7d4c8f9b6-ghi56    1/1     Running   0          2m
```

**All should say `Running`**. If not, see Troubleshooting section.

### 8.2 Check Service
```bash
kubectl get service -n phoenix-app
```

Look for `EXTERNAL-IP`:
```
NAME              TYPE           EXTERNAL-IP                      PORT(S)        AGE
phoenix-service   LoadBalancer   a1b2c3d4.us-east-1.elb.amazonaws.com   80:31234/TCP   5m
```

**If it says `<pending>`**: Wait 2-5 minutes and check again.

### 8.3 Get Your App URL
```bash
kubectl get service phoenix-service -n phoenix-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Copy the URL and **open in browser** - YOUR APP IS LIVE! 🎉

---

## 📊 STEP 9: MONITOR YOUR APP

### View Logs
```bash
# See all pods
kubectl get pods -n phoenix-app

# View logs from specific pod (replace pod-name)
kubectl logs -f phoenix-app-7d4c8f9b6-abc12 -n phoenix-app
```

### Watch Pod Status (Live Updates)
```bash
kubectl get pods -n phoenix-app --watch
```
Press `Ctrl+C` to exit.

### Check Auto-Scaling
```bash
kubectl get hpa -n phoenix-app
```

Shows current CPU/memory and replica count.

---

## 🔄 STEP 10: UPDATE YOUR APP (Future Changes)

When you make changes to your app:

### 10.1 Rebuild Image
```bash
docker build -t task-manager:v2 .
```

### 10.2 Tag New Version
```bash
docker tag task-manager:v2 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:v2
```

### 10.3 Push to ECR
```bash
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:v2
```

### 10.4 Update Deployment
```bash
kubectl set image deployment/phoenix-app \
  phoenix-app=123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager:v2 \
  -n phoenix-app
```

### 10.5 Watch Rolling Update
```bash
kubectl rollout status deployment/phoenix-app -n phoenix-app
```

**Zero downtime!** Old pods stay running until new ones are ready.

---

## 🛠️ TROUBLESHOOTING

### Problem: Pods Stuck in "Pending"

**Check pod details**:
```bash
kubectl describe pod <pod-name> -n phoenix-app
```

**Common causes**:
- Not enough cluster resources (need bigger nodes)
- Image pull errors (check ECR URL in deployment.yaml)

**Solution**: Add more nodes or use smaller resource requests.

---

### Problem: Pods Crashing (CrashLoopBackOff)

**View logs**:
```bash
kubectl logs <pod-name> -n phoenix-app
```

**Common causes**:
- Missing environment variables (check configmap.yaml)
- Wrong Supabase credentials
- App errors (check logs for details)

**Solution**: Fix configmap.yaml and reapply:
```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/phoenix-app -n phoenix-app
```

---

### Problem: Can't Access App (504 Gateway Timeout)

**Check service**:
```bash
kubectl describe service phoenix-service -n phoenix-app
```

**Common causes**:
- Pods not ready (check pod status)
- Security groups blocking traffic
- Health checks failing

**Solution**: Ensure pods are `Running` and `1/1 READY`.

---

### Problem: LoadBalancer Stuck in "Pending"

**Check service**:
```bash
kubectl describe service phoenix-service -n phoenix-app
```

**Common causes**:
- AWS Load Balancer Controller not installed
- IAM permissions missing
- Subnet configuration issues

**Solution**: Verify EKS cluster has AWS Load Balancer Controller:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

## 🧹 CLEANUP (Delete Everything)

**To delete the entire deployment**:
```bash
kubectl delete namespace phoenix-app
```

**To delete ECR repository**:
```bash
aws ecr delete-repository \
  --repository-name task-manager \
  --region us-east-1 \
  --force
```

---

## 📚 WHAT EACH FILE DOES

### Dockerfile
- **Multi-stage build**: Compiles React app, then serves with nginx
- **Stage 1**: Builds optimized production files
- **Stage 2**: Serves files with lightweight web server
- **Result**: Small image (~50MB vs 300MB)

### docker-compose.yml
- **For local testing only**
- Runs app on your computer before deploying
- Not used in production

### nginx.conf
- **Web server configuration**
- Handles React Router (all URLs → index.html)
- Enables compression for faster loading
- Sets security headers

### k8s/namespace.yaml
- **Creates isolated environment**
- Like a folder for your app's resources
- Keeps things organized

### k8s/configmap.yaml
- **Stores configuration**
- Environment variables for your app
- Can change without rebuilding image

### k8s/deployment.yaml
- **Defines HOW to run your app**
- 3 replicas = 3 copies running
- Auto-restarts if pods crash
- Rolling updates (no downtime)
- Resource limits (CPU/memory)
- Health checks (auto-healing)

### k8s/service.yaml
- **Exposes app to internet**
- Type: LoadBalancer = AWS creates ELB
- Routes traffic to healthy pods
- Single public URL

### k8s/hpa.yaml
- **Auto-scales based on load**
- Min 2 pods, max 10 pods
- Scales up when CPU > 70%
- Scales down when CPU < 70% for 5 mins
- Handles traffic spikes automatically

### k8s/ingress.yaml
- **Advanced routing (optional)**
- Use custom domain
- HTTPS/SSL support
- Path-based routing
- Requires AWS Load Balancer Controller

---

## 🎓 KEY CONCEPTS EXPLAINED

### Container vs Image
- **Image**: Recipe (blueprint)
- **Container**: Running cake (actual app running)
- One image → Many containers

### Pod
- Smallest deployable unit in Kubernetes
- Contains 1+ containers
- Has IP address
- Can be replaced instantly

### Deployment
- Manages pods
- Ensures desired number running
- Handles updates and rollbacks
- Self-healing (restarts crashed pods)

### Service
- Stable IP/DNS for pods
- Load balances traffic
- Pods come and go, service stays

### Load Balancer
- AWS ELB in front of service
- Public IP address
- Distributes traffic
- Health checks

### HPA (Horizontal Pod Autoscaler)
- Watches metrics (CPU, memory)
- Adds/removes pods automatically
- Scales horizontally (more pods, not bigger pods)

---

## 🚀 NEXT STEPS

After successful deployment:

1. **Set up monitoring**
   - AWS CloudWatch
   - Kubernetes Dashboard
   - Prometheus + Grafana

2. **Custom domain**
   - Route 53 DNS
   - ACM certificate for HTTPS
   - Update ingress.yaml

3. **CI/CD pipeline**
   - GitHub Actions
   - Automatic builds on commit
   - Auto-deploy to EKS

4. **Improve security**
   - Restrict RLS policies
   - Add authentication
   - Use secrets for sensitive data

5. **Performance**
   - CDN (CloudFront)
   - Caching
   - Database indexes

---

## 📞 HELP & RESOURCES

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **AWS EKS Docs**: https://docs.aws.amazon.com/eks/
- **Docker Docs**: https://docs.docker.com/
- **Lovable Docs**: https://docs.lovable.dev/

---

## ✅ CHECKLIST

Before deploying, make sure:
- [ ] Docker Desktop installed and running
- [ ] AWS CLI configured with credentials
- [ ] kubectl installed
- [ ] Downloaded all project files
- [ ] Built Docker image successfully
- [ ] Pushed image to ECR
- [ ] Created tasks table in database
- [ ] Updated configmap.yaml with Supabase credentials
- [ ] Updated deployment.yaml with ECR image URL
- [ ] Connected to EKS cluster
- [ ] All YAML files applied
- [ ] Pods running (3/3)
- [ ] Service has EXTERNAL-IP
- [ ] App accessible in browser

---

**🎉 CONGRATULATIONS!**

You've deployed a production-ready application to AWS EKS with:
✅ High availability (3 replicas)
✅ Auto-scaling (2-10 pods)
✅ Auto-healing (crashed pods restart)
✅ Zero-downtime updates
✅ Load balancing
✅ Secure configuration

**You're now a DevOps engineer!** 🚀
