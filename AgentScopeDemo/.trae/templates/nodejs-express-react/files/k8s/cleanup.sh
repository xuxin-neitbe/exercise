#!/bin/bash

# Kubernetes 清理脚本
# 删除所有部署资源

set -e

NAMESPACE="{{K8S_NAMESPACE}}"
PROJECT_NAME="{{PROJECT_NAME}}"

echo "⚠️  警告：此操作将删除 $NAMESPACE 命名空间中的所有资源"
read -p "确认继续？(y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo "🗑️  删除命名空间：$NAMESPACE"
kubectl delete namespace $NAMESPACE --ignore-not-found

echo "✅ 清理完成！"
