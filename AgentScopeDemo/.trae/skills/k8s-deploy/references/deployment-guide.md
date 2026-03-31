# 部署指南

## 部署流程

### 步骤 1：准备配置

```bash
# 确认配置文件存在
ls -la .trae/*.yaml

# 验证 YAML 格式
kubectl apply --dry-run=client -f .trae/namespace.yaml
```

### 步骤 2：创建命名空间

```bash
kubectl apply -f .trae/namespace.yaml

# 验证
kubectl get namespace {{K8S_NAMESPACE}}
```

### 步骤 3：创建镜像拉取密钥

```bash
kubectl create secret docker-registry {{ACR_NAMESPACE}}-registry-secret \
  --docker-server={{ACR_REGISTRY}} \
  --docker-username={{ACR_USERNAME}} \
  --docker-password={{ACR_PASSWORD}} \
  --docker-email={{ACR_EMAIL}} \
  -n {{K8S_NAMESPACE}}
```

### 步骤 4：应用 Deployment

```bash
# 部署后端
kubectl apply -f .trae/server-deployment.yaml

# 部署前端
kubectl apply -f .trae/web-deployment.yaml

# 验证
kubectl get deployments -n {{K8S_NAMESPACE}}
```

### 步骤 5：应用 Service

```bash
# 部署后端 Service
kubectl apply -f .trae/server-service.yaml

# 部署前端 Service
kubectl apply -f .trae/web-service.yaml

# 验证
kubectl get services -n {{K8S_NAMESPACE}}
```

### 步骤 6：验证部署

```bash
# 查看所有资源
kubectl get all -n {{K8S_NAMESPACE}}

# 查看 Pod 状态
kubectl get pods -n {{K8S_NAMESPACE}}

# 等待 Pod 就绪
kubectl wait --for=condition=ready pod \
  --selector=app={{PROJECT_NAME}}-server \
  -n {{K8S_NAMESPACE}} \
  --timeout=120s
```

## 部署脚本

### deploy.sh

```bash
#!/bin/bash

set -e

# 配置
NAMESPACE="my-shop-prod"
CONFIG_DIR=".trae"

echo "🚀 开始部署到 Kubernetes..."

# 1. 创建命名空间
echo "📦 创建命名空间..."
kubectl apply -f ${CONFIG_DIR}/namespace.yaml

# 2. 创建镜像拉取密钥
echo "🔐 创建镜像拉取密钥..."
kubectl create secret docker-registry vibe-canva-registry-secret \
  --docker-server=${ACR_REGISTRY} \
  --docker-username=${ACR_USERNAME} \
  --docker-password=${ACR_PASSWORD} \
  -n ${NAMESPACE} \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. 应用 Deployment
echo "📤 部署应用..."
kubectl apply -f ${CONFIG_DIR}/server-deployment.yaml
kubectl apply -f ${CONFIG_DIR}/web-deployment.yaml

# 4. 应用 Service
echo "🌐 部署 Service..."
kubectl apply -f ${CONFIG_DIR}/server-service.yaml
kubectl apply -f ${CONFIG_DIR}/web-service.yaml

# 5. 等待就绪
echo "⏳ 等待 Pod 就绪..."
kubectl wait --for=condition=ready pod \
  --selector=app=my-shop-server \
  -n ${NAMESPACE} \
  --timeout=120s

kubectl wait --for=condition=ready pod \
  --selector=app=my-shop-web \
  -n ${NAMESPACE} \
  --timeout=120s

echo "✅ 部署完成！"

# 6. 显示状态
echo "📊 部署状态："
kubectl get all -n ${NAMESPACE}
```

### rollback.sh

```bash
#!/bin/bash

set -e

NAMESPACE="my-shop-prod"
PROJECT_NAME="my-shop"

echo "↩️  回滚部署..."

# 回滚 Deployment
kubectl rollout undo deployment/${PROJECT_NAME}-server -n ${NAMESPACE}
kubectl rollout undo deployment/${PROJECT_NAME}-web -n ${NAMESPACE}

# 等待回滚完成
kubectl rollout status deployment/${PROJECT_NAME}-server -n ${NAMESPACE}
kubectl rollout status deployment/${PROJECT_NAME}-web -n ${NAMESPACE}

echo "✅ 回滚完成！"
```

## 多环境部署

### 部署到开发环境

```bash
export K8S_NAMESPACE=my-shop-dev
export ACR_REGISTRY=crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
export ACR_NAMESPACE=vibe-canva

./deploy.sh
```

### 部署到生产环境

```bash
export K8S_NAMESPACE=my-shop-prod
export ACR_REGISTRY=crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
export ACR_NAMESPACE=vibe-canva

./deploy.sh
```

## CI/CD集成

### GitHub Actions

```yaml
name: Deploy to K8s

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Configure kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > ~/.kube/config
      
      - name: Deploy to K8s
        run: |
          kubectl apply -f .trae/namespace.yaml
          kubectl apply -f .trae/server-deployment.yaml
          kubectl apply -f .trae/web-deployment.yaml
      
      - name: Verify deployment
        run: |
          kubectl wait --for=condition=ready pod \
            --selector=app=my-shop-server \
            -n my-shop-prod \
            --timeout=120s
```

## 部署验证

### 检查清单

- [ ] 命名空间创建成功
- [ ] 镜像拉取密钥创建成功
- [ ] Deployment 创建成功
- [ ] Service 创建成功
- [ ] Pod 运行正常
- [ ] Service 可访问

### 验证命令

```bash
# 检查所有资源
kubectl get all -n {{K8S_NAMESPACE}}

# 检查 Pod 状态
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}

# 检查日志
kubectl logs -f deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 测试 Service
kubectl run test --rm -it --image=busybox --restart=Never \
  -- wget -qO- http://{{PROJECT_NAME}}-server.{{K8S_NAMESPACE}}.svc.cluster.local/health
```
