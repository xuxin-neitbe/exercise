# 环境配置文件

## 概述

环境配置文件用于定义应用运行时需要的环境变量。

## 后端环境配置

**文件：** `apps/server/.env.example`

**作用：** 定义后端服务的环境变量

### 完整配置

```bash
# ==================== 服务器配置 ====================
PORT=3000
NODE_ENV=development

# ==================== 数据库配置 ====================
# PostgreSQL
DATABASE_URL=postgresql://localhost:5432/{{PROJECT_NAME}}_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_POOL_SIZE=10

# 或者 MySQL
# DATABASE_URL=mysql://localhost:3306/{{PROJECT_NAME}}_dev
# DATABASE_USER=root
# DATABASE_PASSWORD=your_password_here

# ==================== Redis 配置 ====================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ==================== JWT 配置 ====================
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ==================== 日志配置 ====================
LOG_LEVEL=info
LOG_FORMAT=json

# ==================== CORS 配置 ====================
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# ==================== 文件上传配置 ====================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ==================== ACR 配置 ====================
ACR_REGISTRY={{ACR_REGISTRY}}
ACR_NAMESPACE={{ACR_NAMESPACE}}

# ==================== 邮件配置 ====================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@example.com

# ==================== 第三方服务配置 ====================
# 短信服务
# SMS_PROVIDER=aliyun
# SMS_ACCESS_KEY=
# SMS_ACCESS_SECRET=

# 对象存储
# OSS_PROVIDER=aliyun
# OSS_BUCKET=
# OSS_ENDPOINT=
# OSS_ACCESS_KEY=
# OSS_ACCESS_SECRET=
```

### 必填变量

```bash
# 必须修改的变量
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/my-shop_dev
JWT_SECRET=change_this_secret_in_production
```

### 开发环境配置

**文件：** `apps/server/.env.development`

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/my-shop_dev
LOG_LEVEL=debug
LOG_FORMAT=pretty
CORS_ORIGIN=http://localhost:3000
```

### 生产环境配置

**文件：** `apps/server/.env.production`

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://db.example.com:5432/my-shop_prod
DATABASE_POOL_SIZE=20
LOG_LEVEL=info
LOG_FORMAT=json
CORS_ORIGIN=https://my-shop.example.com
```

## 前端环境配置

**文件：** `apps/web/.env.example`

**作用：** 定义前端应用的环境变量

### 完整配置

```bash
# ==================== 应用配置 ====================
VITE_APP_TITLE={{PROJECT_NAME}}
VITE_APP_DESCRIPTION={{PROJECT_DESCRIPTION}}

# ==================== API 配置 ====================
# 开发环境
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000

# 生产环境（取消注释并修改）
# VITE_API_URL=https://api.my-shop.example.com

# ==================== 认证配置 ====================
VITE_AUTH_ENABLED=true
VITE_TOKEN_STORAGE=localStorage

# ==================== 功能开关 ====================
VITE_FEATURE_REGISTER=true
VITE_FEATURE_LOGIN=true
VITE_FEATURE_SOCIAL_LOGIN=false

# ==================== 第三方服务 ====================
# 统计
# VITE_GA_TRACKING_ID=UA-XXXXX-Y

# 客服
# VITE_INTERCOM_APP_ID=xxxxx

# ==================== 构建配置 ====================
VITE_BUILD_MODE=production
VITE_SOURCE_MAP=false
```

### 开发环境配置

**文件：** `apps/web/.env.development`

```bash
VITE_APP_TITLE=my-shop
VITE_API_URL=http://localhost:3000/api
VITE_BUILD_MODE=development
VITE_SOURCE_MAP=true
```

### 生产环境配置

**文件：** `apps/web/.env.production`

```bash
VITE_APP_TITLE=my-shop
VITE_API_URL=https://api.my-shop.example.com
VITE_BUILD_MODE=production
VITE_SOURCE_MAP=false
```

## 环境变量使用说明

### 1. 复制示例文件

```bash
# 后端
cd apps/server
cp .env.example .env

# 前端
cd apps/web
cp .env.example .env
```

### 2. 修改配置

编辑 `.env` 文件，填入实际的值：

```bash
# 修改数据库密码
DATABASE_PASSWORD=your_actual_password

# 修改 JWT 密钥
JWT_SECRET=your_actual_secret_key_here

# 修改 API 地址
VITE_API_URL=https://api.my-shop.example.com
```

### 3. 验证配置

```bash
# 后端
cd apps/server
npm run start

# 前端
cd apps/web
npm run dev
```

## 敏感信息管理

### 不要提交敏感信息到 Git

**错误做法：**

```bash
# .env 文件包含真实密码
DATABASE_PASSWORD=real_password_123
JWT_SECRET=real_secret_key
```

**正确做法：**

```bash
# .env.example 使用占位符
DATABASE_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here_change_in_production
```

### 使用 .gitignore

```gitignore
# 忽略实际的环境配置文件
apps/server/.env
apps/web/.env

# 但保留示例文件
apps/server/.env.example
apps/web/.env.example
```

### 使用密钥管理服务

**生产环境推荐使用：**
- AWS Secrets Manager
- Azure Key Vault
- 阿里云密钥管理服务
- Kubernetes Secrets

**Kubernetes Secrets 示例：**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{PROJECT_NAME}}-secrets
  namespace: {{K8S_NAMESPACE}}
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:password@db:5432/my-shop
  JWT_SECRET: super-secret-key
```

## 环境变量验证

### 后端验证脚本

```javascript
// scripts/validate-env.js
const required = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('缺少必需的环境变量:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('环境变量验证通过！');
```

### 前端验证脚本

```javascript
// scripts/validate-env.js
const required = [
  'VITE_APP_TITLE',
  'VITE_API_URL'
];

const missing = required.filter(key => !import.meta.env[key]);

if (missing.length > 0) {
  console.error('缺少必需的环境变量:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('环境变量验证通过！');
```

## 常见问题

### Q: 环境变量不生效？

A: 检查：
1. 文件命名是否正确（.env）
2. 是否重启了服务
3. 前端变量是否以 VITE_ 开头

### Q: 如何在不同环境使用不同配置？

A: 使用多个环境文件：
```bash
.env.development
.env.staging
.env.production
```

在 package.json 中指定：
```json
{
  "scripts": {
    "dev": "dotenv -e .env.development node app.js",
    "start": "dotenv -e .env.production node app.js"
  }
}
```

### Q: 如何在 Docker 中使用环境变量？

A: 在 Dockerfile 中：
```dockerfile
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
```

在 docker-compose.yml 中：
```yaml
services:
  server:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/my-shop
```
