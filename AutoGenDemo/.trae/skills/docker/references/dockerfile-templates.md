# Dockerfile 模板

## Node.js 项目

### 后端 Dockerfile

**文件：** `apps/server/Dockerfile`

```dockerfile
# ==================== 阶段 1：构建 ====================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# ==================== 阶段 2：生产 ====================
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制构建产物
COPY --from=builder /app .

# 设置用户权限
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "src/index.js"]
```

### 前端 Dockerfile

**文件：** `apps/web/Dockerfile`

```dockerfile
# ==================== 阶段 1：构建 ====================
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ==================== 阶段 2：生产 ====================
FROM nginx:alpine AS production

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:80/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Java 项目

### Spring Boot Dockerfile

```dockerfile
# ==================== 阶段 1：构建 ====================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# 复制 pom.xml
COPY pom.xml .

# 下载依赖
RUN mvn dependency:go-offline

# 复制源代码
COPY src ./src

# 构建项目
RUN mvn clean package -DskipTests

# ==================== 阶段 2：生产 ====================
FROM eclipse-temurin:17-jre-alpine AS production

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S java && \
    adduser -S java -u 1001

# 复制构建产物
COPY --from=builder /app/target/*.jar app.jar

# 设置用户权限
USER java

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Python 项目

### FastAPI Dockerfile

```dockerfile
# ==================== 阶段 1：构建 ====================
FROM python:3.11-slim AS builder

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# ==================== 阶段 2：生产 ====================
FROM python:3.11-slim AS production

WORKDIR /app

# 创建非 root 用户
RUN useradd -m -u 1001 python

# 安装运行时依赖
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# 复制源代码
COPY --from=builder /app .

# 设置用户权限
USER python

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8000/health || exit 1

# 启动应用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Go 项目

### Gin Dockerfile

```dockerfile
# ==================== 阶段 1：构建 ====================
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# ==================== 阶段 2：生产 ====================
FROM alpine:latest AS production

WORKDIR /app

# 安装 ca 证书
RUN apk --no-cache add ca-certificates

# 创建非 root 用户
RUN addgroup -g 1001 -S go && \
    adduser -S go -u 1001

# 复制编译产物
COPY --from=builder /app/main .

# 设置用户权限
USER go

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8080/health || exit 1

# 启动应用
CMD ["./main"]
```

## 多架构镜像

### 使用 buildx

```dockerfile
# 在 Dockerfile 中使用平台特定指令
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# ... 构建步骤 ...

FROM --platform=$TARGETPLATFORM node:18-alpine AS production

# ... 生产步骤 ...
```

**构建命令：**

```bash
# 创建 builder
docker buildx create --name mybuilder --use

# 多平台构建
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-shop-server:latest \
  --push \
  ./apps/server
```

## .dockerignore 模板

**文件：** `.dockerignore`

```
# 依赖
node_modules
npm-debug.log
yarn-error.log

# 构建产物
dist
build
.next

# 环境配置
.env
.env.local
.env.*.local

# 版本控制
.git
.gitignore

# 文档
*.md
README*
LICENSE

# 测试
coverage
.nyc_output
*.test.js

# IDE
.idea
.vscode
*.swp
*.swo

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

## nginx.conf 模板

**文件：** `apps/web/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## 最佳实践总结

### 1. 使用多阶段构建

- 减少最终镜像大小
- 分离构建环境和运行环境
- 提高安全性

### 2. 使用非 root 用户

- 创建专用用户
- 设置合适的 UID/GID
- 使用 USER 指令切换

### 3. 优化层缓存

- 先复制依赖配置
- 再复制源代码
- 减少不必要的层

### 4. 添加健康检查

- 使用 HEALTHCHECK 指令
- 设置合理的间隔和超时
- 检查关键服务状态

### 5. 使用 .dockerignore

- 排除不必要的文件
- 减少构建上下文大小
- 提高构建速度

## 常见问题

### Q: 镜像太大怎么办？

A: 
1. 使用多阶段构建
2. 使用 alpine 基础镜像
3. 清理不必要的文件
4. 合并 RUN 指令

### Q: 构建速度慢怎么办？

A:
1. 优化 .dockerignore
2. 利用层缓存
3. 使用 BuildKit
4. 并行构建

### Q: 如何提高安全性？

A:
1. 使用非 root 用户
2. 扫描镜像漏洞
3. 使用可信基础镜像
4. 最小化安装的包
