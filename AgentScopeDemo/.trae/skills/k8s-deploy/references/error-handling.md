# 错误处理

## 错误码列表

### K8S_CONNECTION_FAILED

**说明：** 无法连接到 K8s 集群

**原因：**
- kubeconfig 配置错误
- 网络问题
- 集群不可用

**解决方案：**
1. 检查 kubeconfig：`kubectl config view`
2. 验证网络连接
3. 确认集群状态

```json
{
  "success": false,
  "error": {
    "code": "K8S_CONNECTION_FAILED",
    "message": "无法连接到 Kubernetes 集群",
    "details": {
      "cluster": "my-cluster",
      "error": "dial tcp: lookup cluster: no such host"
    }
  }
}
```

### NAMESPACE_NOT_FOUND

**说明：** 命名空间不存在

**原因：**
- 命名空间未创建
- 命名空间名称错误

**解决方案：**
1. 创建命名空间：`kubectl apply -f namespace.yaml`
2. 检查命名空间：`kubectl get namespaces`

```json
{
  "success": false,
  "error": {
    "code": "NAMESPACE_NOT_FOUND",
    "message": "命名空间不存在：my-shop-prod",
    "details": {
      "namespace": "my-shop-prod",
      "available_namespaces": ["default", "kube-system"]
    }
  }
}
```

### DEPLOYMENT_FAILED

**说明：** 部署失败

**原因：**
- YAML 格式错误
- 资源配置无效
- 镜像不存在

**解决方案：**
1. 验证 YAML：`kubectl apply --dry-run=client -f deployment.yaml`
2. 检查镜像地址
3. 查看详细错误

```json
{
  "success": false,
  "error": {
    "code": "DEPLOYMENT_FAILED",
    "message": "Deployment 创建失败",
    "details": {
      "deployment": "my-shop-server",
      "error": "ImagePullBackOff"
    }
  }
}
```

### IMAGE_PULL_FAILED

**说明：** 镜像拉取失败

**原因：**
- 镜像拉取密钥错误
- 镜像地址错误
- ACR 权限不足

**解决方案：**
1. 检查镜像拉取密钥
2. 验证镜像地址
3. 确认 ACR 权限

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_PULL_FAILED",
    "message": "镜像拉取失败",
    "details": {
      "image": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-server:latest",
      "error": "pull access denied"
    }
  }
}
```

## 错误排查流程

### 1. 检查集群连接

```bash
# 验证 kubectl 配置
kubectl config view

# 测试连接
kubectl cluster-info

# 查看节点状态
kubectl get nodes
```

### 2. 检查命名空间

```bash
# 查看命名空间
kubectl get namespaces

# 验证命名空间存在
kubectl get namespace {{K8S_NAMESPACE}}
```

### 3. 检查资源状态

```bash
# 查看所有资源
kubectl get all -n {{K8S_NAMESPACE}}

# 查看事件
kubectl get events -n {{K8S_NAMESPACE}} --sort-by='.lastTimestamp'
```

### 4. 查看详细错误

```bash
# Pod 详情
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}

# Deployment 详情
kubectl describe deployment {{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}
```

## 常见问题

### Q: Pod 一直处于 Pending 状态？

A:
1. 检查资源配额：`kubectl describe quota -n {{K8S_NAMESPACE}}`
2. 查看节点资源：`kubectl top nodes`
3. 检查调度器日志

### Q: Pod 反复重启？

A:
1. 查看日志：`kubectl logs {{POD_NAME}} -n {{K8S_NAMESPACE}}`
2. 检查 liveness probe 配置
3. 验证资源限制

### Q: 无法访问 Service？

A:
1. 检查 Endpoint：`kubectl get endpoints`
2. 验证 Pod 标签匹配
3. 测试 Service 连接
