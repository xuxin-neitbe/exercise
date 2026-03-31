---
name: k8s-deploy
description: 部署应用到 Kubernetes 集群。当需要应用 K8s 配置、管理 Deployment、Service、查看 Pod 状态时使用。
---

# K8s Deploy Skill

## 何时使用此 Skill

使用此 Skill 当：
- 部署应用到 Kubernetes 集群
- 应用 K8s 配置文件（YAML）
- 管理 Deployment、Service、ConfigMap
- 查看 Pod 状态和日志
- 管理 K8s 命名空间和资源

## 核心工作流程

### 1. 准备 K8s 配置

**配置文件清单：**
- `.trae/namespace.yaml` - 命名空间
- `.trae/server-deployment.yaml` - 后端 Deployment
- `.trae/web-deployment.yaml` - 前端 Deployment
- `.trae/server-service.yaml` - 后端 Service
- `.trae/web-service.yaml` - 前端 Service

详见：[K8s 配置](./references/k8s-configs.md)

### 2. 应用配置到集群

**部署命令：**

```bash
# 1. 创建命名空间
kubectl apply -f .trae/namespace.yaml

# 2. 创建镜像拉取密钥
kubectl create secret docker-registry {{ACR_NAMESPACE}}-registry-secret \
  --docker-server={{ACR_REGISTRY}} \
  --docker-username={{ACR_USERNAME}} \
  --docker-password={{ACR_PASSWORD}} \
  -n {{K8S_NAMESPACE}}

# 3. 应用 Deployment
kubectl apply -f .trae/server-deployment.yaml
kubectl apply -f .trae/web-deployment.yaml

# 4. 应用 Service
kubectl apply -f .trae/server-service.yaml
kubectl apply -f .trae/web-service.yaml
```

详见：[部署指南](./references/deployment-guide.md)

### 3. 验证部署状态

**检查命令：**

```bash
# 查看命名空间
kubectl get namespaces

# 查看 Deployment
kubectl get deployments -n {{K8S_NAMESPACE}}

# 查看 Pod
kubectl get pods -n {{K8S_NAMESPACE}}

# 查看 Service
kubectl get services -n {{K8S_NAMESPACE}}

# 查看 Pod 详情
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}
```

详见：[验证指南](./references/verification.md)

### 4. 查看日志和调试

**日志命令：**

```bash
# 查看 Pod 日志
kubectl logs -f deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 查看特定 Pod 日志
kubectl logs -f {{POD_NAME}} -n {{K8S_NAMESPACE}}

# 查看上一个实例的日志
kubectl logs -f {{POD_NAME}} -n {{K8S_NAMESPACE}} --previous
```

**进入容器：**

```bash
# 进入 Pod
kubectl exec -it {{POD_NAME}} -n {{K8S_NAMESPACE}} -- sh

# 执行命令
kubectl exec -it {{POD_NAME}} -n {{K8S_NAMESPACE}} -- npm run dev
```

详见：[调试指南](./references/debugging.md)

### 5. 扩缩容和更新

**扩缩容：**

```bash
# 扩容到 3 个副本
kubectl scale deployment {{PROJECT_NAME}}-server --replicas=3 -n {{K8S_NAMESPACE}}

# 自动扩缩容
kubectl autoscale deployment {{PROJECT_NAME}}-server \
  --min=2 --max=10 --cpu-percent=80 \
  -n {{K8S_NAMESPACE}}
```

**更新部署：**

```bash
# 滚动更新
kubectl set image deployment/{{PROJECT_NAME}}-server \
  server={{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:v2 \
  -n {{K8S_NAMESPACE}}

# 查看更新状态
kubectl rollout status deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}

# 回滚
kubectl rollout undo deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}
```

详见：[运维指南](./references/operations.md)

## 输入/输出规范

### 输入参数

```json
{
  "action": "deploy",
  "project_info": {
    "name": "my-shop"
  },
  "k8s_config": {
    "namespace": "my-shop-prod",
    "acr_registry": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com",
    "acr_namespace": "vibe-canva"
  },
  "config_dir": "/path/to/project/.trae"
}
```

### 输出结果

**成功：**
```json
{
  "success": true,
  "deployed_resources": {
    "namespace": "my-shop-prod",
    "deployments": ["my-shop-server", "my-shop-web"],
    "services": ["my-shop-server", "my-shop-web"],
    "pods": 4
  },
  "status": "Running"
}
```

**失败：**
```json
{
  "success": false,
  "error": {
    "code": "K8S_CONNECTION_FAILED",
    "message": "无法连接到 K8s 集群"
  }
}
```

## 错误处理

**常见错误码：**
- `K8S_CONNECTION_FAILED` - 无法连接到 K8s 集群
- `NAMESPACE_NOT_FOUND` - 命名空间不存在
- `DEPLOYMENT_FAILED` - 部署失败
- `IMAGE_PULL_FAILED` - 镜像拉取失败

详见：[错误处理](./references/error-handling.md)

## 部署策略

### 1. 滚动更新（推荐）

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 2. 蓝绿部署

```yaml
# 部署两个版本，通过 Service 切换
```

### 3. 金丝雀发布

```yaml
# 先部署少量实例，逐步增加
```

## 最佳实践

### 1. 资源限制

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 2. 健康检查

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. 日志收集

```yaml
# 使用 EFK 或 Loki 收集日志
```

### 4. 监控告警

```yaml
# 使用 Prometheus + Grafana 监控
```

## 使用示例

**示例 1：部署到生产环境**

```
输入：
- project_info.name: my-shop
- k8s_config.namespace: my-shop-prod

执行：
1. 创建命名空间
2. 创建镜像拉取密钥
3. 应用 Deployment
4. 应用 Service
5. 验证部署状态
```

**示例 2：查看部署状态**

```
命令：
kubectl get all -n my-shop-prod

输出：
NAME                                  READY   STATUS    RESTARTS   AGE
pod/my-shop-server-6d9b8c7f5-x2k4m   1/1     Running   0          5m
pod/my-shop-web-5f8d7c6b4-j9k8l      1/1     Running   0          5m

NAME                     TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/my-shop-server   ClusterIP   10.0.0.100   <none>        80/TCP    5m
service/my-shop-web      ClusterIP   10.0.0.101   <none>        80/TCP    5m

NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/my-shop-server   2/2     2            2           5m
deployment.apps/my-shop-web      2/2     2            2           5m
```

## 相关资源

- [K8s 配置](./references/k8s-configs.md) - YAML 配置详解
- [部署指南](./references/deployment-guide.md) - 部署命令和流程
- [验证指南](./references/verification.md) - 验证部署状态
- [调试指南](./references/debugging.md) - 日志和调试
- [运维指南](./references/operations.md) - 扩缩容和更新
- [错误处理](./references/error-handling.md) - 错误码和处理
