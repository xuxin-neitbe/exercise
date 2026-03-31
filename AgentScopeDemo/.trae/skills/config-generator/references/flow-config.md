# 云效流水线配置

## 概述

云效流水线（Flow）是阿里云提供的 CI/CD 服务，用于自动化构建、测试和部署。

## 配置模板

**位置：** `.trae/templates/configs/flow-yunxiao.yml`

## 基本结构

```yaml
version: '1.0'
name: '{{PROJECT_NAME}}-pipeline'
description: '{{PROJECT_DESCRIPTION}}的 CI/CD 流水线'

trigger:
  type: auto
  branches:
    - main
    - master

stages:
  - name: build
    steps:
      - name: Build Docker Images
        type: docker_build
        # ...
  
  - name: push
    steps:
      - name: Push to ACR
        type: docker_push
        # ...
  
  - name: deploy
    steps:
      - name: Deploy to K8s
        type: k8s_deploy
        # ...
```

## 触发配置

### 自动触发

```yaml
trigger:
  type: auto
  branches:
    - main
    - master
  events:
    - push
    - pull_request
```

### 手动触发

```yaml
trigger:
  type: manual
```

## 阶段配置

### 阶段 1：构建（build）

**作用：** 构建 Docker 镜像

```yaml
stages:
  - name: build
    steps:
      - name: Build Docker Images
        type: docker_build
        config:
          dockerfile: './Dockerfile'
          context: '.'
          images:
            - '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'
            - '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-web:latest'
          build_args:
            - NODE_ENV=production
```

**配置说明：**
- `dockerfile` - Dockerfile 路径
- `context` - 构建上下文
- `images` - 要构建的镜像列表
- `build_args` - 构建参数

### 阶段 2：推送（push）

**作用：** 推送镜像到 ACR 私有仓库

```yaml
stages:
  - name: push
    steps:
      - name: Push to ACR
        type: docker_push
        config:
          registry: '{{ACR_REGISTRY}}'
          credentials:
            username: '${ACR_USERNAME}'
            password: '${ACR_PASSWORD}'
          images:
            - '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'
            - '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-web:latest'
```

**配置说明：**
- `registry` - ACR 镜像仓库地址
- `credentials` - 认证信息（从环境变量读取）
- `images` - 要推送的镜像列表

### 阶段 3：部署（deploy）

**作用：** 部署到 Kubernetes 集群

#### ACK 部署

```yaml
stages:
  - name: deploy
    steps:
      - name: Deploy to K8s
        type: k8s_deploy
        config:
          cluster: '${K8S_CLUSTER_ID}'
          namespace: '{{K8S_NAMESPACE}}'
          manifests:
            - './.trae/namespace.yaml'
            - './.trae/server-deployment.yaml'
            - './.trae/web-deployment.yaml'
          imagePullSecrets:
            - '{{ACR_NAMESPACE}}-registry-secret'
```

#### ECS 部署

```yaml
stages:
  - name: deploy
    steps:
      - name: Deploy to ECS
        type: ssh_deploy
        config:
          host: '${ECS_HOST}'
          username: '${ECS_USERNAME}'
          privateKey: '${ECS_PRIVATE_KEY}'
          commands:
            - 'docker pull {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'
            - 'docker stop {{PROJECT_NAME}}-server || true'
            - 'docker rm {{PROJECT_NAME}}-server || true'
            - 'docker run -d --name {{PROJECT_NAME}}-server -p 3000:3000 {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'
```

## 环境变量

**在云效控制台配置：**

```bash
# ACR 认证
ACR_USERNAME=your-username
ACR_PASSWORD=your-password

# K8s 集群
K8S_CLUSTER_ID=cluster-id
K8S_NAMESPACE=project-namespace

# ECS 服务器（如使用）
ECS_HOST=1.2.3.4
ECS_USERNAME=root
ECS_PRIVATE_KEY=your-private-key
```

## 完整示例

```yaml
version: '1.0'
name: 'my-shop-pipeline'
description: '在线商城系统的 CI/CD 流水线'

trigger:
  type: auto
  branches:
    - main
    - master

stages:
  - name: build
    steps:
      - name: Build Docker Images
        type: docker_build
        config:
          dockerfile: './Dockerfile'
          context: '.'
          images:
            - 'crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-server:latest'
            - 'crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-web:latest'

  - name: push
    steps:
      - name: Push to ACR
        type: docker_push
        config:
          registry: 'crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com'
          images:
            - 'crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-server:latest'
            - 'crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-web:latest'

  - name: deploy
    steps:
      - name: Deploy to K8s
        type: k8s_deploy
        config:
          cluster: 'c123456789'
          namespace: 'my-shop-prod'
          manifests:
            - './.trae/namespace.yaml'
            - './.trae/server-deployment.yaml'
            - './.trae/web-deployment.yaml'
```

## 最佳实践

### 1. 使用变量替换

```yaml
# 使用变量，不要硬编码
images:
  - '{{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/{{PROJECT_NAME}}-server:latest'

# 不要硬编码
images:
  - 'crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/my-shop-server:latest'
```

### 2. 多环境部署

```yaml
stages:
  - name: deploy-staging
    condition: branch == 'develop'
    steps:
      - name: Deploy to Staging
        type: k8s_deploy
        config:
          namespace: '{{PROJECT_NAME}}-staging'

  - name: deploy-prod
    condition: branch == 'main'
    steps:
      - name: Deploy to Production
        type: k8s_deploy
        config:
          namespace: '{{PROJECT_NAME}}-prod'
```

### 3. 添加测试阶段

```yaml
stages:
  - name: test
    steps:
      - name: Run Unit Tests
        type: shell
        script: |
          npm install
          npm test
      
      - name: Run E2E Tests
        type: shell
        script: |
          npm run e2e
```

### 4. 添加通知

```yaml
notifications:
  success:
    - type: dingtalk
      webhook: '${DINGTALK_WEBHOOK}'
  failure:
    - type: dingtalk
      webhook: '${DINGTALK_WEBHOOK}'
    - type: email
      recipients: '${NOTIFICATION_EMAIL}'
```

## 常见问题

### Q: 流水线执行失败怎么办？

A: 检查：
1. ACR 认证信息是否正确
2. K8s 集群是否可访问
3. 镜像仓库权限是否足够
4. YAML 格式是否正确

### Q: 如何调试流水线？

A: 使用云效的"手动执行"功能，可以查看每个步骤的详细日志。

### Q: 如何优化构建速度？

A: 使用 Docker 层缓存，配置缓存策略：
```yaml
cache:
  type: docker
  paths:
    - /var/lib/docker
```
