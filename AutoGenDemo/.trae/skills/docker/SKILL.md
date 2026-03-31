---
name: docker
description: 生成 Docker 配置文件和管理 Docker 镜像。当需要创建 Dockerfile、docker-compose.yml、构建或推送 Docker 镜像时使用。
---

# Docker Skill

## 何时使用此 Skill

使用此 Skill 当：
- 创建新项目需要 Docker 配置
- 需要生成 Dockerfile
- 需要生成 docker-compose.yml
- 需要构建或推送 Docker 镜像
- 需要配置 ACR 私有镜像仓库

## 核心工作流程

### 1. 生成 Dockerfile

**后端 Dockerfile：**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

**前端 Dockerfile：**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

详见：[Dockerfile 模板](./references/dockerfile-templates.md)

### 2. 生成 docker-compose.yml

**开发环境配置：**
```yaml
version: '3.8'
services:
  server:
    build: ./apps/server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://db:5432/my-shop
    depends_on:
      - db
  
  web:
    build: ./apps/web
    ports:
      - "80:80"
    depends_on:
      - server
  
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=my-shop
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

详见：[docker-compose 配置](./references/docker-compose.md)

### 3. 构建 Docker 镜像

**构建命令：**
```bash
# 构建后端镜像
docker build -t my-shop-server:latest ./apps/server

# 构建前端镜像
docker build -t my-shop-web:latest ./apps/web

# 多平台构建
docker buildx build --platform linux/amd64,linux/arm64 \
  -t my-shop-server:latest ./apps/server
```

详见：[镜像构建指南](./references/build-guide.md)

### 4. 推送镜像到 ACR

**推送流程：**
1. 登录 ACR
2. 标记镜像
3. 推送镜像

**命令：**
```bash
# 登录 ACR
docker login --username={{ACR_USERNAME}} \
  --password={{ACR_PASSWORD}} \
  {{ACR_REGISTRY}}

# 标记镜像
docker tag my-shop-server:latest \
  {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest

# 推送镜像
docker push {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest
```

详见：[ACR 推送指南](./references/acr-push.md)

## 输入/输出规范

### 输入参数

```json
{
  "action": "generate_dockerfile",
  "project_info": {
    "name": "my-shop",
    "tech_stack": "nodejs-express-react"
  },
  "docker_config": {
    "base_image": "node:18-alpine",
    "port": 3000,
    "workdir": "/app"
  },
  "target_dir": "/path/to/project"
}
```

### 输出结果

**成功：**
```json
{
  "success": true,
  "files_generated": 2,
  "files": [
    "apps/server/Dockerfile",
    "apps/web/Dockerfile",
    "docker-compose.yml"
  ]
}
```

**失败：**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TECH_STACK",
    "message": "不支持的技术栈"
  }
}
```

## 错误处理

**常见错误码：**
- `INVALID_TECH_STACK` - 技术栈不支持
- `DOCKER_NOT_INSTALLED` - Docker 未安装
- `BUILD_FAILED` - 构建失败
- `PUSH_FAILED` - 推送失败

详见：[错误处理](./references/error-handling.md)

## 最佳实践

### 1. 多阶段构建

使用多阶段构建减少镜像大小：

```dockerfile
FROM node:18-alpine AS builder
# 构建阶段

FROM node:18-alpine AS production
# 生产阶段，只复制构建产物
```

### 2. 使用 .dockerignore

排除不需要的文件：

```
node_modules
npm-debug.log
.git
.env
*.md
```

### 3. 非 root 用户运行

提高安全性：

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 4. 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:3000/health || exit 1
```

## 使用示例

**示例 1：生成 Node.js 项目 Dockerfile**

```
输入：
- project_info.name: my-shop
- project_info.tech_stack: nodejs-express-react

生成：
- apps/server/Dockerfile
- apps/web/Dockerfile
- docker-compose.yml
```

**示例 2：构建并推送镜像**

```
命令：
docker build -t my-shop-server ./apps/server
docker tag my-shop-server:latest {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest
docker push {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest
```

## 相关资源

- [Dockerfile 模板](./references/dockerfile-templates.md) - 各技术栈 Dockerfile 模板
- [docker-compose 配置](./references/docker-compose.md) - 开发环境配置
- [镜像构建指南](./references/build-guide.md) - 构建命令和技巧
- [ACR 推送指南](./references/acr-push.md) - 推送到阿里云 ACR
- [错误处理](./references/error-handling.md) - 错误码和处理方法
