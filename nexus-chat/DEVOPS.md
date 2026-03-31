# DevOps 部署指南

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        生产环境架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   用户请求 ──▶ 阿里云 SLB ──▶ ECS 服务器                             │
│                                    │                                 │
│                                    ▼                                 │
│                              ┌──────────┐                           │
│                              │  Nginx   │                           │
│                              │ (可选)    │                           │
│                              └──────────┘                           │
│                                    │                                 │
│                    ┌───────────────┼───────────────┐                │
│                    ▼               ▼               ▼                │
│              ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│              │ Next.js  │   │ Socket   │   │  Redis   │            │
│              │  App     │   │ Server   │   │  Cache   │            │
│              │ :3000    │   │ :3002    │   │ :6379    │            │
│              └──────────┘   └──────────┘   └──────────┘            │
│                    │               │                                 │
│                    └───────┬───────┘                                 │
│                            ▼                                         │
│                      ┌──────────┐                                   │
│                      │PostgreSQL│                                   │
│                      │  :5432   │                                   │
│                      └──────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 二、CI/CD 流水线

### 2.1 流水线流程

```
代码推送 ──▶ Lint ──▶ Test ──▶ Build ──▶ Docker Build ──▶ 部署
   │          │         │         │            │            │
   │          ▼         ▼         ▼            ▼            ▼
   │       ESLint    Jest     Next.js    镜像构建      ECS部署
   │       类型检查   覆盖率    构建       推送镜像      健康检查
   │
   └──▶ 触发条件: push to main/develop, PR
```

### 2.2 GitHub Secrets 配置

在 GitHub 仓库设置中配置以下 Secrets：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `ALIYUN_REGISTRY` | 阿里云镜像仓库地址 | `registry.cn-hangzhou.aliyuncs.com` |
| `ALIYUN_REGISTRY_USERNAME` | 镜像仓库用户名 | 阿里云账号 |
| `ALIYUN_REGISTRY_PASSWORD` | 镜像仓库密码 | 阿里云账号密码 |
| `ECS_HOST` | ECS 公网 IP | 阿里云控制台 |
| `ECS_USERNAME` | SSH 用户名 | 通常为 `root` |
| `ECS_SSH_KEY` | SSH 私钥 | 本地生成 |
| `CODECOV_TOKEN` | Codecov Token | codecov.io |

## 三、本地开发环境

### 3.1 环境要求

- Node.js 20+
- Docker Desktop
- Git

### 3.2 快速启动

```bash
# 1. 克隆代码
git clone https://github.com/your-username/nexus-chat.git
cd nexus-chat

# 2. 安装依赖
npm install

# 3. 复制环境变量
cp .env.example .env.local

# 4. 启动 Docker 服务（数据库、Redis、Socket服务）
docker compose up -d

# 5. 初始化数据库
npx prisma migrate dev

# 6. 启动开发服务器
npm run dev
```

### 3.3 Docker 服务管理

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止所有服务
docker compose down

# 清理数据（危险操作）
docker compose down -v
```

## 四、生产部署

### 4.1 阿里云资源准备

#### 必需资源

| 资源类型 | 规格 | 月费用（约） | 用途 |
|---------|------|------------|------|
| ECS 服务器 | 2核4G | ¥100-200 | 应用部署 |
| RDS PostgreSQL | 基础版 | ¥100-300 | 数据库（可选，可用 Docker） |
| 容器镜像服务 | 免费版 | ¥0 | 镜像存储 |
| SLB 负载均衡 | 按量付费 | ¥20-50 | 流量分发（可选） |
| 域名 + SSL | - | ¥50-100 | HTTPS 访问 |

#### 推荐配置（个人项目）

```
最低配置（月费用约 ¥150-300）:
- ECS: 2核4G，按量付费
- 数据库: Docker 部署 PostgreSQL
- 镜像仓库: 阿里云免费版
- 域名: 阿里云域名 + 免费 SSL
```

### 4.2 服务器初始化

```bash
# 在 ECS 服务器上执行
curl -fsSL https://raw.githubusercontent.com/your-username/nexus-chat/main/scripts/setup-ecs.sh | bash
```

### 4.3 手动部署步骤

```bash
# 1. 登录服务器
ssh root@your-ecs-ip

# 2. 进入项目目录
cd /opt/nexus-chat

# 3. 编辑环境变量
vim .env.production

# 4. 登录镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com

# 5. 拉取最新镜像
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/nexus-chat:latest

# 6. 执行数据库迁移
docker compose run --rm app npx prisma migrate deploy

# 7. 启动服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 8. 检查服务状态
docker compose ps
```

### 4.4 自动部署（推荐）

配置好 GitHub Secrets 后，推送到 `main` 分支会自动触发部署：

```bash
git push origin main
```

## 五、监控与运维

### 5.1 日志查看

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f app
docker compose logs -f socket-server

# 查看最近 100 行日志
docker compose logs --tail=100 app
```

### 5.2 健康检查

```bash
# 应用健康检查
curl http://localhost:3000/api/health

# 数据库连接检查
docker compose exec postgres pg_isready

# Redis 连接检查
docker compose exec redis redis-cli ping
```

### 5.3 备份策略

```bash
# 数据库备份
docker compose exec postgres pg_dump -U nexus nexus_chat > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20260222.sql | docker compose exec -T postgres psql -U nexus nexus_chat
```

### 5.4 常见问题排查

#### 应用无法启动

```bash
# 检查容器状态
docker compose ps

# 检查容器日志
docker compose logs app

# 检查环境变量
docker compose config
```

#### 数据库连接失败

```bash
# 检查数据库是否运行
docker compose ps postgres

# 检查数据库连接
docker compose exec postgres psql -U nexus -d nexus_chat -c "SELECT 1"
```

#### 内存不足

```bash
# 查看容器资源使用
docker stats

# 清理未使用资源
docker system prune -a
```

## 六、安全建议

### 6.1 必需配置

- [ ] 修改数据库默认密码
- [ ] 配置防火墙规则（仅开放必要端口）
- [ ] 启用 HTTPS（配置 SSL 证书）
- [ ] 设置 NEXTAUTH_SECRET 为强密码
- [ ] 定期更新依赖包

### 6.2 推荐配置

- [ ] 配置 Redis 密码
- [ ] 启用数据库 SSL 连接
- [ ] 配置日志轮转
- [ ] 设置自动备份

## 七、成本优化建议

### 7.1 阿里云省钱技巧

1. **使用按量付费**：开发测试环境使用按量付费，不用时关机
2. **抢占式实例**：非关键服务可使用抢占式实例，价格低 70%
3. **预留实例券**：长期稳定运行可购买预留实例券
4. **资源包**：流量和存储可购买资源包

### 7.2 免费资源

| 资源 | 免费额度 | 说明 |
|-----|---------|------|
| 阿里云容器镜像服务 | 免费版 | 适合个人项目 |
| GitHub Actions | 2000 分钟/月 | 公开仓库无限 |
| 阿里云 OSS | 40GB/年 | 新用户活动 |

## 八、扩展阅读

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [阿里云容器镜像服务](https://help.aliyun.com/product/60716.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
