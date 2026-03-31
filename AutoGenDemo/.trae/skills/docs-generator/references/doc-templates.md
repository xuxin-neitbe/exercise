# 文档模板集合

## 部署文档模板

**文件：** `docs/DEPLOYMENT.md`

```markdown
# {{PROJECT_NAME}} 部署指南

## 环境要求

### 生产环境

- **服务器：** 2 核 4G 或更高
- **操作系统：** Linux (Ubuntu 20.04+)
- **Docker：** 20.10+
- **Kubernetes：** 1.24+ (可选)

### 依赖服务

- **数据库：** PostgreSQL 14+
- **缓存：** Redis 7+
- **镜像仓库：** 阿里云 ACR

## 本地开发部署

### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 访问服务

- 前端：http://localhost:3000
- 后端：http://localhost:3000/api
- 数据库：localhost:5432

## 生产环境部署

### 1. 准备服务器

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. 配置环境变量

```bash
# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/my-shop
JWT_SECRET=your-secret-key-here
EOF
```

### 3. 部署应用

```bash
# 拉取镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 验证部署
docker-compose ps
```

## Kubernetes 部署

### 前置条件

- K8s 集群 (1.24+)
- kubectl 配置完成
- ACR 镜像拉取密钥

### 部署步骤

```bash
# 1. 创建命名空间
kubectl apply -f .trae/namespace.yaml

# 2. 创建镜像拉取密钥
kubectl create secret docker-registry acr-secret \
  --docker-server=<ACR_REGISTRY> \
  --docker-username=<USERNAME> \
  --docker-password=<PASSWORD> \
  -n my-shop-prod

# 3. 应用配置
kubectl apply -f .trae/deployments/

# 4. 验证部署
kubectl get all -n my-shop-prod
```

## CI/CD 部署

### 云效流水线

1. 导入项目到云效
2. 配置流水线 YAML
3. 设置环境变量
4. 触发部署

详见：[云效配置](../.trae/flow-yunxiao.yml)

## 故障排查

### 容器无法启动

```bash
# 查看日志
docker-compose logs server

# 检查配置
docker-compose config
```

### 数据库连接失败

```bash
# 测试连接
docker-compose exec server ping db

# 检查数据库状态
docker-compose ps db
```

### 端口冲突

```bash
# 查看占用端口的进程
lsof -i :3000

# 修改端口
# 编辑 docker-compose.yml 中的端口映射
```

## 监控和维护

### 日志管理

```bash
# 查看日志
docker-compose logs -f

# 清理日志
docker-compose logs --tail=100
```

### 备份数据库

```bash
# 备份
docker-compose exec db pg_dump -U postgres my-shop > backup.sql

# 恢复
cat backup.sql | docker-compose exec -T db psql -U postgres -d my-shop
```

### 更新应用

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 清理旧镜像
docker image prune -f
```
```

## API 文档模板

**文件：** `docs/API.md`

```markdown
# {{PROJECT_NAME}} API 文档

## 基础信息

- **基础 URL：** http://localhost:3000/api
- **认证方式：** JWT Bearer Token
- **内容类型：** application/json

## 认证

### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 使用 Token

在所有 API 请求的 Header 中添加：

```
Authorization: Bearer <token>
```

## API 端点

### 用户相关

#### 获取用户列表

```http
GET /api/users
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "user@example.com",
      "createdAt": "2026-03-08T10:00:00Z"
    }
  ]
}
```

#### 创建用户

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser@example.com",
  "password": "password123"
}
```

### 商品相关

#### 获取商品列表

```http
GET /api/products
```

**查询参数：**
- `page` - 页码（默认 1）
- `limit` - 每页数量（默认 20）
- `sort` - 排序字段

**响应：**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pages": 5
  }
}
```

## 错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-----------|
| 400 | 请求参数错误 | Bad Request |
| 401 | 未授权 | Unauthorized |
| 403 | 禁止访问 | Forbidden |
| 404 | 资源不存在 | Not Found |
| 500 | 服务器错误 | Internal Server Error |

**错误响应格式：**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  }
}
```

## 速率限制

- 普通用户：100 请求/分钟
- VIP 用户：1000 请求/分钟

超过限制返回 429 错误。
```

## 使用指南模板

**文件：** `docs/GUIDE.md`

```markdown
# {{PROJECT_NAME}} 使用指南

## 快速开始

### 1. 注册账号

访问 http://localhost:3000/register 注册账号。

### 2. 登录系统

使用注册的邮箱和密码登录。

### 3. 创建第一个项目

登录后点击"新建项目"按钮。

## 功能说明

### 项目管理

- 创建项目
- 编辑项目信息
- 删除项目
- 项目成员管理

### 用户设置

- 修改个人信息
- 更改密码
- 头像上传

## 常见问题

### Q: 如何重置密码？

A: 在登录页面点击"忘记密码"，按提示操作。

### Q: 如何邀请成员？

A: 进入项目设置，点击"邀请成员"，输入邮箱地址。

### Q: 数据如何备份？

A: 系统每天自动备份，也可手动导出。

## 最佳实践

1. 定期修改密码
2. 启用双因素认证
3. 定期导出数据备份
```
