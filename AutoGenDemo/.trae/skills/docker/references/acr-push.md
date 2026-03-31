# ACR 推送指南

## 概述

阿里云容器镜像服务（ACR）用于存储和管理 Docker 镜像。

## 配置 ACR

### 1. 创建命名空间

登录阿里云控制台：
1. 访问 https://cr.console.aliyun.com
2. 创建命名空间：`vibe-canva`

### 2. 获取访问凭证

**固定密码：**
1. 访问控制台 → 访问凭证
2. 设置固定密码
3. 记录用户名和密码

**临时密码：**
```bash
# 使用 CLI 获取临时密码
aliyun cr GetAuthorizationToken --region cn-hangzhou
```

## 推送流程

### 完整流程

```bash
# 1. 登录 ACR
docker login --username={{ACR_USERNAME}} \
  --password={{ACR_PASSWORD}} \
  {{ACR_REGISTRY}}

# 2. 构建镜像
docker build -t my-shop-server:latest ./apps/server

# 3. 标记镜像
docker tag my-shop-server:latest \
  {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest

# 4. 推送镜像
docker push {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest
```

## 推送脚本

### push-to-acr.sh

```bash
#!/bin/bash

set -e

# 配置
IMAGE_NAME="my-shop-server"
VERSION=${1:-latest}
ACR_REGISTRY="crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com"
ACR_NAMESPACE="vibe-canva"

# 从环境变量读取凭证
if [ -z "$ACR_USERNAME" ] || [ -z "$ACR_PASSWORD" ]; then
  echo "错误：请设置 ACR_USERNAME 和 ACR_PASSWORD 环境变量"
  exit 1
fi

# 构建
echo "🔨 构建镜像 ${IMAGE_NAME}:${VERSION}..."
docker build -t ${IMAGE_NAME}:${VERSION} ./apps/server

# 标记
echo "🏷️  标记镜像..."
docker tag ${IMAGE_NAME}:${VERSION} \
  ${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:${VERSION}

# 登录
echo "🔐 登录 ACR..."
docker login -u ${ACR_USERNAME} -p ${ACR_PASSWORD} ${ACR_REGISTRY}

# 推送
echo "📤 推送镜像..."
docker push ${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:${VERSION}

echo "✅ 推送成功！"
echo "镜像：${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:${VERSION}"
```

### 使用方法

```bash
# 设置环境变量
export ACR_USERNAME="your-username"
export ACR_PASSWORD="your-password"

# 推送最新版本
./push-to-acr.sh latest

# 推送特定版本
./push-to-acr.sh 1.0.0
```

## 多镜像推送

### push-all.sh

```bash
#!/bin/bash

set -e

ACR_REGISTRY="crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com"
ACR_NAMESPACE="vibe-canva"
VERSION=${1:-latest}

# 推送后端
echo "📤 推送后端镜像..."
docker build -t my-shop-server:${VERSION} ./apps/server
docker tag my-shop-server:${VERSION} ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:${VERSION}
docker push ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:${VERSION}

# 推送前端
echo "📤 推送前端镜像..."
docker build -t my-shop-web:${VERSION} ./apps/web
docker tag my-shop-web:${VERSION} ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-web:${VERSION}
docker push ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-web:${VERSION}

echo "✅ 所有镜像推送成功！"
```

## GitHub Actions 自动推送

### .github/workflows/push-to-acr.yml

```yaml
name: Push to ACR

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

env:
  ACR_REGISTRY: crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com
  ACR_NAMESPACE: vibe-canva

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to ACR
        uses: docker/login-action@v2
        with:
          registry: ${{ env.ACR_REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push server
        uses: docker/build-push-action@v4
        with:
          context: ./apps/server
          push: true
          tags: |
            ${{ env.ACR_REGISTRY }}/${{ env.ACR_NAMESPACE }}/my-shop-server:latest
            ${{ env.ACR_REGISTRY }}/${{ env.ACR_NAMESPACE }}/my-shop-server:${{ github.ref_name }}

      - name: Build and push web
        uses: docker/build-push-action@v4
        with:
          context: ./apps/web
          push: true
          tags: |
            ${{ env.ACR_REGISTRY }}/${{ env.ACR_NAMESPACE }}/my-shop-web:latest
            ${{ env.ACR_REGISTRY }}/${{ env.ACR_NAMESPACE }}/my-shop-web:${{ github.ref_name }}
```

## 镜像版本管理

### 版本策略

```bash
# 语义化版本
docker tag my-shop-server:latest ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:1.0.0

# Git 标签
docker tag my-shop-server:latest ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:$(git describe --tags)

# Git 提交
docker tag my-shop-server:latest ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:$(git rev-parse --short HEAD)

# 时间戳
docker tag my-shop-server:latest ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:$(date +%Y%m%d-%H%M%S)
```

### 清理旧镜像

```bash
# 列出所有镜像
aliyun cr ListRepoTag --NamespaceName vibe-canva --RepoName my-shop-server

# 删除旧镜像
aliyun cr DeleteRepoTag --NamespaceName vibe-canva --RepoName my-shop-server --Tag v1.0.0
```

## 镜像安全

### 漏洞扫描

```bash
# 触发扫描
aliyun cr StartRepoScan --NamespaceName vibe-canva --RepoName my-shop-server

# 查看扫描结果
aliyun cr GetRepoScanReport --NamespaceName vibe-canva --RepoName my-shop-server
```

### 访问控制

**RAM 策略：**

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cr:PushImage",
        "cr:PullImage"
      ],
      "Resource": [
        "acs:cr:*:*:repository/vibe-canva/*"
      ]
    }
  ]
}
```

## 监控和日志

### 推送日志

```bash
# 查看推送历史
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

# 查看推送详情
docker inspect ${ACR_REGISTRY}/${ACR_NAMESPACE}/my-shop-server:latest
```

### 监控告警

配置云监控：
1. 访问 https://cms.console.aliyun.com
2. 创建监控项：镜像推送成功率
3. 设置告警规则

## 常见问题

### Q: 登录失败？

A:
1. 检查用户名和密码
2. 确认 ACR 实例状态
3. 检查网络连接

### Q: 推送失败？

A:
1. 检查命名空间是否存在
2. 确认镜像标签格式正确
3. 检查磁盘空间

### Q: 推送速度慢？

A:
1. 使用阿里云 ECS 推送
2. 压缩镜像大小
3. 使用增量推送

### Q: 权限不足？

A:
1. 检查 RAM 策略
2. 确认子账号权限
3. 联系管理员

## 最佳实践

### 1. 使用 CI/CD 自动推送

不要手动推送，使用 GitHub Actions 或云效自动推送

### 2. 使用语义化版本

```bash
# 好的做法
my-shop-server:1.0.0
my-shop-server:1.0.1

# 不好的做法
my-shop-server:latest  # 生产环境不要只用 latest
```

### 3. 多环境隔离

```bash
# 开发环境
my-shop-server:dev-1.0.0

# 生产环境
my-shop-server:prod-1.0.0
```

### 4. 定期清理

定期删除旧镜像，节省存储空间
