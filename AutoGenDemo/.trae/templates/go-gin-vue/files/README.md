# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 技术栈

### 后端
- **Go {{GO_VERSION}}+**
- **Gin {{GIN_VERSION}}**
- **GORM**
- **MySQL/PostgreSQL**

### 前端
- **Vue 3+**
- **Vite**
- **Axios**

## 快速开始

### 环境要求
- Go {{GO_VERSION}}+
- Node.js 18+
- Docker & Docker Compose（可选）

### 本地开发

1. **安装依赖**
```bash
npm install
```

2. **启动后端**
```bash
cd apps/server
go mod download
go run main.go
```

3. **启动前端**
```bash
cd apps/web
npm run dev
```

4. **访问应用**
- 前端：http://localhost:3000
- 后端 API：http://localhost:8080/api

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 项目结构

```
{{PROJECT_NAME}}/
├── apps/
│   ├── server/          # Gin 后端
│   │   ├── main.go
│   │   ├── go.mod
│   │   └── Dockerfile
│   └── web/            # Vue 前端
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml
└── package.json
```

## 功能特性

- ✅ RESTful API
- ✅ JWT 认证
- ✅ 高性能
- ✅ Docker 容器化
- ✅ Kubernetes 部署
- ✅ CI/CD 流水线

## 开发指南

### 添加新 API

1. 在 `apps/server/main.go` 添加路由
2. 定义数据模型
3. 实现业务逻辑
4. 添加单元测试

### 添加前端组件

1. 在 `apps/web/src/components/` 创建 Vue 组件
2. 在页面中引入组件
3. 添加样式

## 部署

### Kubernetes 部署

```bash
cd k8s
./deploy.sh
```

详细配置请参考 [k8s/README.md](k8s/README.md)

## 许可证

MIT
