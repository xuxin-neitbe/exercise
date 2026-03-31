# K8s 配置

## 概述

Kubernetes 配置用于定义应用在 K8s 集群中的部署方式。

## 配置文件

### 1. Namespace 配置

**文件：** `.trae/namespace.yaml`

**作用：** 创建项目独立的命名空间

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: '{{K8S_NAMESPACE}}'
  labels:
    app.kubernetes.io/name: '{{PROJECT_NAME}}'
    app.kubernetes.io/description: '{{PROJECT_DESCRIPTION}}'
    app.kubernetes.io/created-at: '{{TIMESTAMP}}'
```

**生成示例：**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: 'my-shop-prod'
  labels:
    app.kubernetes.io/name: 'my-shop'
    app.kubernetes.io/description: '在线商城系统'
```

### 2. Server Deployment 配置

**文件：** `.trae/server-deployment.yaml`

**作用：** 部署后端服务

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: '{{PROJECT_NAME}}-server'
  namespace: '{{K8S_NAMESPACE}}'
  labels:
    app: '{{PROJECT_NAME}}-server'
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: '{{PROJECT_NAME}}-server'
  template:
    metadata:
      labels:
        app: '{{PROJECT_NAME}}-server'
    spec:
      containers:
        - name: server
          image: '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: '3000'
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
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
      imagePullSecrets:
        - name: '{{ACR_NAMESPACE}}-registry-secret'
```

**关键配置说明：**

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| replicas | 副本数 | 生产：2+，开发：1 |
| resources.requests | 资源请求 | 根据实际需求 |
| resources.limits | 资源限制 | 请求的 2 倍 |
| livenessProbe | 存活探针 | 检测死锁 |
| readinessProbe | 就绪探针 | 检测就绪 |

### 3. Web Deployment 配置

**文件：** `.trae/web-deployment.yaml`

**作用：** 部署前端应用（使用 Nginx）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: '{{PROJECT_NAME}}-web'
  namespace: '{{K8S_NAMESPACE}}'
  labels:
    app: '{{PROJECT_NAME}}-web'
    app.kubernetes.io/component: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: '{{PROJECT_NAME}}-web'
  template:
    metadata:
      labels:
        app: '{{PROJECT_NAME}}-web'
    spec:
      containers:
        - name: web
          image: '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-web:latest'
          ports:
            - containerPort: 80
              name: http
          resources:
            requests:
              memory: "128Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
      imagePullSecrets:
        - name: '{{ACR_NAMESPACE}}-registry-secret'
```

### 4. Service 配置（可选）

**文件：** `.trae/server-service.yaml` 和 `.trae/web-service.yaml`

**作用：** 暴露服务

```yaml
apiVersion: v1
kind: Service
metadata:
  name: '{{PROJECT_NAME}}-server'
  namespace: '{{K8S_NAMESPACE}}'
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
  selector:
    app: '{{PROJECT_NAME}}-server'
```

## 资源配置建议

### 开发环境

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "50m"
  limits:
    memory: "256Mi"
    cpu: "200m"
replicas: 1
```

### 生产环境

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
replicas: 2
```

### 高负载环境

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
replicas: 3
```

## 镜像拉取密钥

**创建密钥：**

```bash
kubectl create secret docker-registry {{ACR_NAMESPACE}}-registry-secret \
  --docker-server={{ACR_REGISTRY}} \
  --docker-username={{ACR_USERNAME}} \
  --docker-password={{ACR_PASSWORD}} \
  --docker-email={{ACR_EMAIL}} \
  -n {{K8S_NAMESPACE}}
```

**在 Deployment 中使用：**

```yaml
spec:
  imagePullSecrets:
    - name: '{{ACR_NAMESPACE}}-registry-secret'
```

## 健康检查

### Liveness Probe（存活探针）

检测容器是否运行正常，失败则重启：

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30  # 容器启动后等待 30 秒
  periodSeconds: 10        # 每 10 秒检查一次
  timeoutSeconds: 5        # 超时时间
  failureThreshold: 3      # 失败 3 次后重启
```

### Readiness Probe（就绪探针）

检测容器是否准备好接收流量，失败则从 Service 中移除：

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## 完整示例

**生成后的 namespace.yaml：**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-shop-prod
  labels:
    app.kubernetes.io/name: my-shop
    app.kubernetes.io/description: 在线商城系统
```

**生成后的 server-deployment.yaml：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-shop-server
  namespace: my-shop-prod
  labels:
    app: my-shop-server
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-shop-server
  template:
    metadata:
      labels:
        app: my-shop-server
    spec:
      containers:
        - name: server
          image: crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-server:latest
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: '3000'
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
      imagePullSecrets:
        - name: vibe-canva-registry-secret
```

## 验证配置

**应用配置：**

```bash
kubectl apply -f .trae/namespace.yaml
kubectl apply -f .trae/server-deployment.yaml
kubectl apply -f .trae/web-deployment.yaml
```

**验证部署：**

```bash
# 查看命名空间
kubectl get namespaces

# 查看 Deployment
kubectl get deployments -n {{K8S_NAMESPACE}}

# 查看 Pod
kubectl get pods -n {{K8S_NAMESPACE}}

# 查看 Pod 详情
kubectl describe pod {{POD_NAME}} -n {{K8S_NAMESPACE}}

# 查看日志
kubectl logs -f deployment/{{PROJECT_NAME}}-server -n {{K8S_NAMESPACE}}
```

## 常见问题

### Q: Pod 一直处于 Pending 状态？

A: 检查：
1. 集群资源是否充足
2. 镜像拉取密钥是否正确
3. 节点标签是否匹配

### Q: Pod 反复重启？

A: 检查：
1. 查看日志：`kubectl logs {{POD_NAME}}`
2. 检查 liveness probe 配置
3. 检查资源限制是否过小

### Q: 无法拉取镜像？

A: 检查：
1. imagePullSecrets 是否配置
2. ACR 认证信息是否正确
3. 镜像地址是否正确
