# Nexus Chat

一个基于 Next.js 的现代化实时聊天应用，集成 AI 智能对话建议功能。

## 项目简介

Nexus Chat 是一个功能完整的即时通讯应用，支持实时消息传递、好友管理、用户认证等核心功能。最新版本集成了 AI 对话建议功能，帮助用户更轻松地回复消息。

## 技术栈

### 前端
- **框架**: Next.js 14.1.0 (App Router)
- **UI 库**: React 18
- **状态管理**: Zustand 4.5.0
- **样式**: CSS Modules
- **实时通信**: Socket.io Client

### 后端
- **API**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js
- **实时服务**: Socket.io Server

### AI 集成
- **AI SDK**: Vercel AI SDK
- **提供商**: 通义千问 / DeepSeek / 智谱清言 / OpenAI
- **功能**: 智能对话建议、上下文感知

## 功能特性

### 核心功能
- 用户注册与登录
- 实时消息传递
- 好友管理（添加、删除、搜索）
- 会话管理
- 用户状态显示

### AI 对话建议（新功能）
- **智能建议**: 基于对话上下文生成 1-3 个回复建议
- **一键使用**: 选择建议后可直接发送或编辑后发送
- **用户反馈**: 支持点赞/点踩，帮助改进建议质量
- **使用限制**: 每日 20 次免费使用
- **隐私保护**: 数据脱敏处理，不永久存储对话内容

### AI 功能特性

| 特性 | 说明 |
|------|------|
| 上下文感知 | 基于最近 10 条消息生成建议 |
| 多提供商支持 | 通义千问、DeepSeek、智谱清言、OpenAI |
| 智能降级 | API 失败时自动切换提供商或显示预设建议 |
| 缓存优化 | 相似对话复用建议，减少 API 调用 |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm 或 pnpm

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd Nexus_Chat_GLM5_AI
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填写必要的环境变量（见下方环境变量配置）。

4. **初始化数据库**

```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate:dev
```

5. **启动开发服务器**

```bash
# 启动前端服务
npm run dev

# 在另一个终端启动 Socket 服务
cd socket-server && npm run dev
```

6. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 环境变量配置

### 基础配置

```env
# 数据库连接
DATABASE_URL="postgresql://nexus:nexus123@localhost:5432/nexus_chat"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production-min-32-chars"

# Socket.io 服务器地址
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

### AI 功能配置

```env
# AI 提供商 API Key（至少配置一个）
ALIBABA_API_KEY=your_alibaba_api_key_here      # 推荐，免费额度充足
DEEPSEEK_API_KEY=your_deepseek_api_key_here    # 备选
ZHIPU_API_KEY=your_zhipu_api_key_here          # 备选
OPENAI_API_KEY=your_openai_api_key_here        # 降级备选

# AI 模型配置
AI_PROVIDER=alibaba                            # 默认提供商
AI_MODEL=qwen-plus                             # 默认模型
AI_SUGGESTION_COUNT=3                          # 建议数量（1-3）
AI_DAILY_LIMIT=20                              # 每日使用限制

# Redis 配置（可选，用于缓存和频率限制）
REDIS_URL=redis://localhost:6379
```

### 获取 AI API Key

| 提供商 | 获取地址 | 免费额度 |
|--------|----------|----------|
| 通义千问 | [阿里云百炼](https://modelstudio.console.alibabacloud.com/) | 千万 tokens |
| DeepSeek | [DeepSeek 平台](https://platform.deepseek.com/) | 在线免费 |
| 智谱清言 | [智谱开放平台](https://open.bigmodel.cn/) | GLM-4-Flash 免费 |
| OpenAI | [OpenAI 平台](https://platform.openai.com/) | 无（付费） |

## 项目结构

```
nexus-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ai/            # AI 相关 API
│   │   │   ├── auth/          # 认证 API
│   │   │   ├── conversations/ # 会话 API
│   │   │   ├── friends/       # 好友 API
│   │   │   ├── users/         # 用户 API
│   │   │   └── health/        # 健康检查
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   │
│   ├── components/            # React 组件
│   │   ├── auth/              # 认证组件
│   │   ├── chat/              # 聊天组件
│   │   │   ├── AISuggestionButton.tsx
│   │   │   ├── AISuggestionPanel.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatLayout.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   ├── FriendList.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                # UI 组件
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAISuggestion.ts
│   │   └── useSocket.ts
│   │
│   ├── services/              # 业务逻辑层
│   │   └── ai/                # AI 服务
│   │
│   ├── stores/                # Zustand 状态管理
│   ├── types/                 # TypeScript 类型
│   ├── lib/                   # 工具函数
│   │   └── ai/                # AI 工具
│   └── repositories/          # 数据访问层
│
├── socket-server/             # Socket.io 服务端 (端口 3002)
├── prisma/                    # 数据库 Schema
├── docs/                      # 项目文档
└── tests/                     # 测试文件
```

## API 文档

详细的 API 文档请参阅 [docs/API.md](docs/API.md)。

### 主要 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/conversations` | GET | 获取会话列表 |
| `/api/friends` | GET/POST | 好友管理 |
| `/api/ai/suggestions` | POST | 生成 AI 建议 |
| `/api/ai/feedback` | POST | 提交用户反馈 |
| `/api/ai/config` | GET | 获取 AI 配置 |

## 开发指南

详细的开发指南请参阅 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

### 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:migrate:dev   # 开发环境迁移
npm run db:migrate       # 生产环境迁移
npm run db:studio        # 打开 Prisma Studio
npm run db:generate      # 生成 Prisma 客户端

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式测试
npm run test:coverage    # 测试覆盖率

# 代码质量
npm run lint             # ESLint 检查
npm run typecheck        # TypeScript 类型检查
```

## 文档

- [AI 集成计划](AI_INTEGRATION_PLAN.md) - AI 功能详细设计
- [API 文档](docs/API.md) - API 接口说明
- [开发指南](docs/DEVELOPMENT.md) - 开发环境搭建与规范
- [架构设计](docs/AI_SUGGESTION_ARCHITECTURE.md) - AI 功能架构设计
- [产品审查报告](docs/AI_SUGGESTION_AUDIT_REPORT.md) - 产品需求审查

## 部署

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d
```

### 手动部署

1. 构建项目

```bash
npm run build
```

2. 运行数据库迁移

```bash
npm run db:migrate
```

3. 启动服务

```bash
npm run start
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。

---

**最后更新**: 2026-02-22
