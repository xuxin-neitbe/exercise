#!/bin/bash

# Kubernetes 部署脚本
# 自动部署 {{PROJECT_NAME}} 到 Kubernetes 集群

set -e

NAMESPACE="{{K8S_NAMESPACE}}"
PROJECT_NAME="{{PROJECT_NAME}}"
VERSION="{{PROJECT_VERSION}}"

echo "🚀 开始部署 $PROJECT_NAME 到 Kubernetes 集群..."

# 1. 创建命名空间
echo "📦 创建命名空间：$NAMESPACE"
kubectl apply -f k8s/namespace.yaml

# 2. 创建 Secret（如果不存在）
echo "🔐 创建配置 Secret..."
kubectl apply -f k8s/secrets.yaml

# 3. 创建 ConfigMap
echo "⚙️  创建配置 ConfigMap..."
kubectl apply -f k8s/configmap.yaml

# 4. 创建持久化存储
echo "💾 创建持久化存储..."
kubectl apply -f k8s/postgres-pvc.yaml

# 5. 部署数据库
echo "🗄️  部署 PostgreSQL 数据库..."
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# 6. 等待数据库就绪
echo "⏳ 等待数据库就绪..."
kubectl rollout status deployment/$PROJECT_NAME-postgres -n $NAMESPACE --timeout=120s

# 7. 部署后端服务
echo "🔧 部署后端服务..."
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/server-service.yaml

# 8. 等待后端服务就绪
echo "⏳ 等待后端服务就绪..."
kubectl rollout status deployment/$PROJECT_NAME-server -n $NAMESPACE --timeout=120s

# 9. 部署前端服务
echo "🎨 部署前端服务..."
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml

# 10. 等待前端服务就绪
echo "⏳ 等待前端服务就绪..."
kubectl rollout status deployment/$PROJECT_NAME-web -n $NAMESPACE --timeout=120s

# 11. 配置 Ingress
echo "🌐 配置 Ingress..."
kubectl apply -f k8s/ingress.yaml

# 12. 获取访问地址
echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 查看部署状态："
echo "   kubectl get all -n $NAMESPACE"
echo ""
echo "🌍 访问地址："
if kubectl get ingress $PROJECT_NAME-ingress -n $NAMESPACE &> /dev/null; then
    INGRESS_IP=$(kubectl get ingress $PROJECT_NAME-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    echo "   http://$INGRESS_IP 或 https://{{INGRESS_HOST}}"
else
    echo "   请手动配置域名或使用 kubectl port-forward 访问"
    echo "   kubectl port-forward svc/$PROJECT_NAME-web-service -n $NAMESPACE 8080:80"
fi
echo ""
