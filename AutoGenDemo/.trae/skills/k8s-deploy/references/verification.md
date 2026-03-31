# 验证和调试指南

## 验证部署状态

### 查看资源

```bash
# 查看所有资源
kubectl get all -n {{K8S_NAMESPACE}}

# 查看命名空间
kubectl get namespaces

# 查看 Deployment
kubectl get deployments -n {{K8S_NAMESPACE}}

# 查看 Pod
kubectl get pods -n {{K8S_NAMESPACE}}

# 查看 Service
kubectl get services -n {{K8S_NAMESPACE}}

# 查看 ReplicaSet
kubectl get replicasets -n {{K8S_NAMESPACE}}
```

### 查看详情

```bash
# Pod 详情
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}

# Deployment 详情
kubectl describe deployment {{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# Service 详情
kubectl describe service {{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}
```

### 查看日志

```bash
# 查看 Deployment 日志
kubectl logs -f deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 查看特定 Pod 日志
kubectl logs -f {{POD_NAME}} -n {{K8S_NAMESPACE}}

# 查看上一个实例日志
kubectl logs -f {{POD_NAME}} -n {{K8S_NAMESPACE}} --previous

# 查看多容器 Pod 日志
kubectl logs -f {{POD_NAME}} -c server -n {{K8S_NAMESPACE}}
```

## 调试技巧

### 进入容器

```bash
# 进入 Pod
kubectl exec -it {{POD_NAME}} -n {{K8S_NAMESPACE}} -- sh

# 以 root 用户进入
kubectl exec -it -u root {{POD_NAME}} -n {{K8S_NAMESPACE}} -- sh

# 执行命令
kubectl exec -it {{POD_NAME}} -n {{K8S_NAMESPACE}} -- ps aux
```

### 端口转发

```bash
# 转发本地端口到 Pod
kubectl port-forward {{POD_NAME}} 3000:3000 -n {{K8S_NAMESPACE}}

# 转发到 Service
kubectl port-forward svc/{{PROJECT_NAME}}-server 3000:80 -n {{K8S_NAMESPACE}}

# 后台转发
kubectl port-forward {{POD_NAME}} 3000:3000 -n {{K8S_NAMESPACE}} &
```

### 测试连接

```bash
# 测试 Service 连接
kubectl run test --rm -it --image=busybox --restart=Never -- \
  wget -qO- http://{{PROJECT_NAME}}-server.{{K8S_NAMESPACE}}.svc.cluster.local/health

# 测试外部访问
curl http://localhost:3000/health
```

## 常见问题排查

### Pod 无法启动

```bash
# 查看 Pod 状态
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}

# 查看事件
kubectl get events -n {{K8S_NAMESPACE}} --sort-by='.lastTimestamp'

# 查看日志
kubectl logs {{POD_NAME}} -n {{K8S_NAMESPACE}}
```

### 镜像拉取失败

```bash
# 检查镜像拉取密钥
kubectl get secrets -n {{K8S_NAMESPACE}}

# 验证密钥配置
kubectl get secret {{ACR_NAMESPACE}}-registry-secret -n {{K8S_NAMESPACE}} -o yaml

# 重新创建密钥
kubectl delete secret {{ACR_NAMESPACE}}-registry-secret -n {{K8S_NAMESPACE}}
kubectl create secret docker-registry {{ACR_NAMESPACE}}-registry-secret \
  --docker-server={{ACR_REGISTRY}} \
  --docker-username={{ACR_USERNAME}} \
  --docker-password={{ACR_PASSWORD}} \
  -n {{K8S_NAMESPACE}}
```

### Service 无法访问

```bash
# 检查 Service 配置
kubectl describe service {{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 检查 Endpoint
kubectl get endpoints {{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 测试 Service
kubectl run test --rm -it --image=busybox --restart=Never -- \
  wget -qO- http://{{PROJECT_NAME}}-server:80/health
```

## 监控命令

### 资源使用

```bash
# 查看节点资源
kubectl top nodes

# 查看 Pod 资源
kubectl top pods -n {{K8S_NAMESPACE}}
```

### 事件监控

```bash
# 查看最近事件
kubectl get events -n {{K8S_NAMESPACE}} --sort-by='.lastTimestamp'

# 持续监控事件
kubectl get events -n {{K8S_NAMESPACE}} --watch
```
