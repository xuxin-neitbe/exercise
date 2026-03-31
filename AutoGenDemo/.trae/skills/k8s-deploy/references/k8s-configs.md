# K8s 配置

## 配置文件清单

### 1. Namespace

**文件：** `.trae/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: '{{K8S_NAMESPACE}}'
  labels:
    app.kubernetes.io/name: '{{PROJECT_NAME}}'
    app.kubernetes.io/description: '{{PROJECT_DESCRIPTION}}'
```

### 2. Server Deployment

**文件：** `.trae/server-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: '{{PROJECT_NAME}}-server'
  namespace: '{{K8S_NAMESPACE}}'
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
        - name: '{{ACR_NAMESPACE}}-registry-secret'
```

### 3. Web Deployment

**文件：** `.trae/web-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: '{{PROJECT_NAME}}-web'
  namespace: '{{K8S_NAMESPACE}}'
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
          resources:
            requests:
              memory: "128Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
      imagePullSecrets:
        - name: '{{ACR_NAMESPACE}}-registry-secret'
```

### 4. Server Service

**文件：** `.trae/server-service.yaml`

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
  selector:
    app: '{{PROJECT_NAME}}-server'
```

### 5. Web Service

**文件：** `.trae/web-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: '{{PROJECT_NAME}}-web'
  namespace: '{{K8S_NAMESPACE}}'
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
  selector:
    app: '{{PROJECT_NAME}}-web'
```

## 资源配置说明

### 副本数（replicas）

| 环境 | 推荐值 | 说明 |
|------|--------|------|
| 开发 | 1 | 节省资源 |
| 生产 | 2+ | 高可用 |
| 高负载 | 3+ | 负载均衡 |

### 资源限制

| 组件 | Memory Request | Memory Limit | CPU Request | CPU Limit |
|------|---------------|--------------|-------------|-----------|
| Server | 256Mi | 512Mi | 100m | 500m |
| Web | 128Mi | 256Mi | 50m | 200m |

### 健康检查

| 探针 | 路径 | 延迟 | 间隔 | 作用 |
|------|------|------|------|------|
| liveness | /health | 30s | 10s | 检测死锁 |
| readiness | /ready | 5s | 5s | 检测就绪 |

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
