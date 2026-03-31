# 镜像构建指南

## 基础构建命令

### 构建单个镜像

```bash
# 基本构建
docker build -t my-shop-server:latest ./apps/server

# 指定 Dockerfile
docker build -f Dockerfile.prod -t my-shop-server:prod ./apps/server

# 使用构建参数
docker build --build-arg NODE_ENV=production -t my-shop-server ./apps/server
```

### 多标签构建

```bash
# 同时打多个标签
docker build -t my-shop-server:latest \
             -t my-shop-server:1.0 \
             -t my-shop-server:$(git rev-parse --short HEAD) \
             ./apps/server
```

### 多平台构建

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 创建 builder
docker buildx create --name mybuilder --use

# 构建多平台镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-shop-server:latest \
  --push \
  ./apps/server
```

## BuildKit 高级用法

### 使用缓存

```bash
# 启用缓存
docker buildx build \
  --cache-from type=registry,ref=my-shop-server:cache \
  --cache-to type=inline \
  -t my-shop-server:latest \
  ./apps/server
```

### 并行构建

```bash
# 同时构建多个镜像
docker buildx build -t my-shop-server ./apps/server &
docker buildx build -t my-shop-web ./apps/web &
wait
```

## Dockerfile 优化技巧

### 1. 层缓存优化

```dockerfile
# ❌ 不好的做法 - 每次都会使缓存失效
COPY . .
RUN npm install

# ✅ 好的做法 - 利用缓存
COPY package*.json ./
RUN npm install
COPY . .
```

### 2. 合并 RUN 指令

```dockerfile
# ❌ 不好的做法 - 创建多个层
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y wget

# ✅ 好的做法 - 单个层
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    wget && \
    rm -rf /var/lib/apt/lists/*
```

### 3. 使用 .dockerignore

```
# 排除大文件
node_modules
.git
*.log

# 排除不需要的文件
*.md
.env
coverage
```

### 4. 多阶段构建

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

## 镜像大小优化

### 对比镜像大小

```bash
# 查看镜像大小
docker images my-shop-server

# 查看镜像层
docker history my-shop-server:latest

# 分析镜像内容
docker run --rm -it my-shop-server:latest sh
du -sh /*
```

### 减小镜像大小

```dockerfile
# 使用 alpine 基础镜像
FROM node:18-alpine

# 清理缓存
RUN rm -rf /var/cache/apk/*

# 使用 slim 镜像
FROM node:18-slim
```

### 镜像大小对比

| 基础镜像 | 大小 | 适用场景 |
|---------|------|---------|
| node:18 | ~900MB | 开发环境 |
| node:18-slim | ~200MB | 生产环境 |
| node:18-alpine | ~100MB | 生产环境（推荐） |

## 构建性能优化

### 1. 使用 BuildKit

```bash
export DOCKER_BUILDKIT=1
docker build -t my-shop-server ./apps/server
```

### 2. 使用构建缓存

```bash
# 本地缓存
docker build --cache-from my-shop-server:cache -t my-shop-server ./apps/server

# 远程缓存
docker buildx build \
  --cache-from type=registry,ref=my-shop-server:cache \
  --cache-to type=registry,ref=my-shop-server:cache \
  -t my-shop-server ./apps/server
```

### 3. 并行构建阶段

```dockerfile
# 使用 RUN --mount=type=cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

## 构建参数

### 使用 ARG

```dockerfile
# 定义构建参数
ARG NODE_ENV=production
ARG VERSION=1.0.0

# 使用参数
ENV NODE_ENV=${NODE_ENV}
LABEL version=${VERSION}

# 条件执行
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --only=production; \
    else \
      npm ci; \
    fi
```

### 传递参数

```bash
# 传递构建参数
docker build \
  --build-arg NODE_ENV=production \
  --build-arg VERSION=1.0.0 \
  -t my-shop-server:1.0.0 \
  ./apps/server
```

## 标签策略

### 语义化版本

```bash
# 主版本
docker tag my-shop-server:latest my-shop-server:1

# 次版本
docker tag my-shop-server:latest my-shop-server:1.0

# 修订版本
docker tag my-shop-server:latest my-shop-server:1.0.0

# Git 提交
docker tag my-shop-server:latest my-shop-server:$(git rev-parse --short HEAD)
```

### 环境标签

```bash
# 开发环境
docker tag my-shop-server:latest my-shop-server:dev

# 测试环境
docker tag my-shop-server:latest my-shop-server:test

# 生产环境
docker tag my-shop-server:latest my-shop-server:prod
```

## 自动化构建脚本

### build.sh

```bash
#!/bin/bash

set -e

# 配置
IMAGE_NAME="my-shop-server"
VERSION=$(git describe --tags --always --dirty)
BUILD_DIR="./apps/server"

# 构建
echo "Building ${IMAGE_NAME}:${VERSION}..."
docker build -t ${IMAGE_NAME}:${VERSION} ${BUILD_DIR}
docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest

# 验证
echo "Verifying build..."
docker run --rm ${IMAGE_NAME}:${VERSION} node --version

echo "✅ Build successful!"
echo "Image: ${IMAGE_NAME}:${VERSION}"
```

### build-and-push.sh

```bash
#!/bin/bash

set -e

IMAGE_NAME="my-shop-server"
ACR_REGISTRY="crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com"
ACR_NAMESPACE="vibe-canva"
VERSION=$(git describe --tags --always --dirty)

# 构建
docker build -t ${IMAGE_NAME}:${VERSION} ./apps/server
docker tag ${IMAGE_NAME}:${VERSION} ${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:${VERSION}

# 登录
docker login -u ${ACR_USERNAME} -p ${ACR_PASSWORD} ${ACR_REGISTRY}

# 推送
docker push ${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:${VERSION}
docker push ${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:latest

echo "✅ Pushed ${VERSION} to ACR"
```

## 常见问题

### Q: 构建速度慢？

A:
1. 启用 BuildKit
2. 优化 .dockerignore
3. 利用层缓存
4. 使用构建缓存

### Q: 镜像太大？

A:
1. 使用 alpine 基础镜像
2. 多阶段构建
3. 清理缓存
4. 合并 RUN 指令

### Q: 构建失败？

A:
1. 查看详细日志：`docker build --progress=plain`
2. 检查 Dockerfile 语法
3. 验证基础镜像是否存在
4. 检查网络连接

### Q: 如何调试构建过程？

A:
```bash
# 在构建过程中停止
docker build --target builder -t debug-image ./apps/server

# 进入中间层
docker run --rm -it debug-image sh
```
