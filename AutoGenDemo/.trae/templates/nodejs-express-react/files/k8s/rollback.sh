#!/bin/bash

# Kubernetes 回滚脚本
# 快速回滚到上一个版本

set -e

NAMESPACE="{{K8S_NAMESPACE}}"
PROJECT_NAME="{{PROJECT_NAME}}"

echo "🔄 开始回滚 $PROJECT_NAME..."

# 回滚后端部署
echo "🔙 回滚后端服务..."
kubectl rollout undo deployment/$PROJECT_NAME-server -n $NAMESPACE

# 回滚前端部署
echo "🔙 回滚前端服务..."
kubectl rollout undo deployment/$PROJECT_NAME-web -n $NAMESPACE

# 等待回滚完成
echo "⏳ 等待回滚完成..."
kubectl rollout status deployment/$PROJECT_NAME-server -n $NAMESPACE --timeout=120s
kubectl rollout status deployment/$PROJECT_NAME-web -n $NAMESPACE --timeout=120s

echo "✅ 回滚完成！"
