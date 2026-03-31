# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 技术栈

### 后端
- **Python {{PYTHON_VERSION}}+**
- **FastAPI {{FASTAPI_VERSION}}**
- **Uvicorn**
- **PostgreSQL/MySQL**
- **SQLAlchemy**

### 前端
- **React 18+**
- **Vite**
- **Axios**

## 快速开始

### 环境要求
- Python {{PYTHON_VERSION}}+
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
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **启动前端**
```bash
cd apps/web
npm run dev
```

4. **访问应用**
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000/api
- API 文档：http://localhost:8000/docs

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
│   ├── server/          # FastAPI 后端
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── web/            # React 前端
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml
└── package.json
```

## 功能特性

- ✅ RESTful API
- ✅ JWT 认证
- ✅ 异步处理
- ✅ 自动 API 文档
- ✅ Docker 容器化
- ✅ Kubernetes 部署

## 开发指南

### 添加新 API

1. 在 `apps/server/main.py` 添加路由
2. 定义 Pydantic 模型
3. 实现业务逻辑
4. 添加单元测试

### 添加前端组件

1. 在 `apps/web/src/components/` 创建 React 组件
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
