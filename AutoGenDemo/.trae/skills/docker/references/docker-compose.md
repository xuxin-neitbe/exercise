# docker-compose 配置

## 开发环境配置

### 完整配置（Node.js + React + PostgreSQL）

**文件：** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ==================== 后端服务 ====================
  server:
    build:
      context: ./apps/server
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/my-shop
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-change-in-production
    volumes:
      - ./apps/server:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - my-shop-network
    restart: unless-stopped

  # ==================== 前端服务 ====================
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    depends_on:
      - server
    networks:
      - my-shop-network
    restart: unless-stopped

  # ==================== 数据库服务 ====================
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=my-shop
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - my-shop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==================== Redis 服务 ====================
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - my-shop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==================== 邮件服务（可选） ====================
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP 端口
      - "8025:8025"  # Web UI 端口
    networks:
      - my-shop-network
    restart: unless-stopped

networks:
  my-shop-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

## 生产环境配置

**文件：** `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  server:
    image: {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-server:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
    networks:
      - my-shop-network

  web:
    image: {{ACR_REGISTRY}}/{{ACR_NAMESPACE}}/my-shop-web:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    depends_on:
      - server
    networks:
      - my-shop-network

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    networks:
      - my-shop-network

networks:
  my-shop-network:
    driver: overlay

volumes:
  postgres_data:
    driver: local
```

## 仅后端配置

**文件：** `docker-compose.backend.yml`

```yaml
version: '3.8'

services:
  server:
    build: ./apps/server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/my-shop
    volumes:
      - ./apps/server:/app
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=my-shop
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 仅前端配置

**文件：** `docker-compose.frontend.yml`

```yaml
version: '3.8'

services:
  web:
    build: ./apps/web
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api
    volumes:
      - ./apps/web:/app
    depends_on:
      - server
  
  server:
    image: node:18-alpine
    command: echo "Use real server in development"
```

## 测试环境配置

**文件：** `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  test:
    build:
      context: ./apps/server
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/my-shop_test
    volumes:
      - ./apps/server:/app
    depends_on:
      - db
    command: npm test

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=my-shop_test
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## 常用命令

### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d server db

# 前台启动（查看日志）
docker-compose up

# 重新构建并启动
docker-compose up -d --build
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 停止特定服务
docker-compose stop server
```

### 查看状态

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs

# 查看特定服务日志
docker-compose logs -f server

# 查看资源使用
docker stats
```

### 进入容器

```bash
# 进入运行中的容器
docker-compose exec server sh

# 以 root 用户进入
docker-compose exec -u root server sh

# 执行命令
docker-compose exec server npm run dev
```

### 数据库操作

```bash
# 进入数据库
docker-compose exec db psql -U postgres -d my-shop

# 备份数据库
docker-compose exec db pg_dump -U postgres my-shop > backup.sql

# 恢复数据库
cat backup.sql | docker-compose exec -T db psql -U postgres -d my-shop
```

## 环境变量管理

### 使用 .env 文件

**文件：** `.env`

```bash
# 数据库配置
POSTGRES_DB=my-shop
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# 应用配置
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# ACR 配置
ACR_REGISTRY=crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
ACR_NAMESPACE=vibe-canva
```

**在 docker-compose.yml 中使用：**

```yaml
services:
  db:
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

## 网络配置

### 自定义网络

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

services:
  web:
    networks:
      - frontend
  
  server:
    networks:
      - frontend
      - backend
  
  db:
    networks:
      - backend
```

### 网络隔离

```yaml
# 前端只能访问后端
# 后端可以访问数据库
# 数据库只能被后端访问
```

## 数据持久化

### 使用卷

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_data:
    driver: local

services:
  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### 绑定挂载

```yaml
services:
  server:
    volumes:
      - ./apps/server:/app
      - /app/node_modules
```

## 健康检查

### PostgreSQL

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Redis

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Node.js 应用

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 最佳实践

### 1. 使用健康检查

确保服务就绪后再启动依赖服务

### 2. 数据持久化

使用卷而不是绑定挂载来持久化数据

### 3. 网络隔离

使用自定义网络实现服务隔离

### 4. 资源限制

设置 CPU 和内存限制防止资源耗尽

### 5. 日志管理

配置日志驱动和日志轮转

```yaml
services:
  server:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 常见问题

### Q: 容器无法启动？

A:
1. 检查端口冲突
2. 查看日志：`docker-compose logs server`
3. 检查依赖服务是否就绪

### Q: 数据库连接失败？

A:
1. 检查 DATABASE_URL 配置
2. 确保数据库服务已启动
3. 检查网络配置

### Q: 数据丢失？

A:
1. 确保使用了持久化卷
2. 不要删除 volume
3. 定期备份数据
