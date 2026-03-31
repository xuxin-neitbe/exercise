# Nexus Chat 开发指南

**版本**: 1.0  
**最后更新**: 2026-02-22

---

## 目录

1. [开发环境搭建](#开发环境搭建)
2. [项目结构](#项目结构)
3. [代码规范](#代码规范)
4. [测试指南](#测试指南)
5. [部署指南](#部署指南)
6. [常见问题](#常见问题)

---

## 开发环境搭建

### 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 推荐使用 LTS 版本 |
| npm | >= 9.0.0 | 或 pnpm >= 8.0.0 |
| PostgreSQL | >= 14.0 | 数据库 |
| Redis | >= 6.0 | 可选，用于缓存和频率限制 |
| Git | >= 2.0 | 版本控制 |

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd Nexus_Chat_GLM5_AI
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填写必要配置：

```env
# 数据库
DATABASE_URL="postgresql://nexus:nexus123@localhost:5432/nexus_chat"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Socket.io
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# AI 提供商（至少配置一个）
ALIBABA_API_KEY=your_alibaba_api_key
```

#### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate:dev
```

#### 5. 启动开发服务器

**方式一：分别启动前后端**

```bash
# 终端 1 - 启动前端
npm run dev

# 终端 2 - 启动 Socket 服务 (端口 3002)
cd socket-server && npm run dev
```

**方式二：使用 Docker Compose**

```bash
docker-compose up -d
```

#### 6. 验证安装

访问 http://localhost:3000，应该能看到登录页面。

### IDE 配置

#### VS Code 推荐插件

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### VS Code 设置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 项目结构

### 目录结构

```
Nexus_Chat_GLM5_AI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ai/            # AI 相关 API
│   │   │   │   ├── suggestions/   # 建议生成
│   │   │   │   ├── feedback/      # 用户反馈
│   │   │   │   └── config/        # 配置查询
│   │   │   ├── auth/          # 认证 API
│   │   │   ├── conversations/ # 会话 API
│   │   │   └── friends/       # 好友 API
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── globals.css        # 全局样式
│   │
│   ├── components/            # React 组件
│   │   ├── auth/              # 认证组件
│   │   │   └── LoginPage.tsx
│   │   ├── chat/              # 聊天组件
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatLayout.tsx
│   │   │   ├── FriendList.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                # UI 组件
│   │       ├── Avatar.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useSocket.ts       # Socket.io Hook
│   │   └── useAISuggestion.ts # AI 建议 Hook
│   │
│   ├── services/              # 业务逻辑层
│   │   ├── ai/                # AI 服务（新增）
│   │   │   ├── ai-service.ts
│   │   │   ├── provider-factory.ts
│   │   │   ├── cache-service.ts
│   │   │   ├── rate-limit-service.ts
│   │   │   └── feedback-service.ts
│   │   └── index.ts
│   │
│   ├── stores/                # Zustand 状态管理
│   │   └── index.ts
│   │
│   ├── types/                 # TypeScript 类型
│   │   ├── index.ts
│   │   └── ai.ts              # AI 类型定义
│   │
│   ├── lib/                   # 工具函数
│   │   ├── auth.ts            # 认证工具
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── ai/                # AI 工具（新增）
│   │       ├── prompt-templates.ts
│   │       └── privacy-utils.ts
│   │
│   └── repositories/          # 数据访问层
│       └── index.ts
│
├── socket-server/             # Socket.io 服务端
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── prisma/                    # 数据库 Schema
│   ├── schema.prisma
│   └── migrations/
│
├── docs/                      # 项目文档
│   ├── API.md
│   ├── DEVELOPMENT.md
│   ├── AI_SUGGESTION_ARCHITECTURE.md
│   └── AI_SUGGESTION_AUDIT_REPORT.md
│
├── tests/                     # 测试文件
│   └── cyberpunk-chat.spec.ts
│
├── AISDK/                     # Vercel AI SDK
│
├── .env.example               # 环境变量模板
├── package.json
├── tsconfig.json
├── next.config.js
└── docker-compose.yml
```

### 关键文件说明

| 文件 | 说明 |
|------|------|
| `src/app/layout.tsx` | 应用根布局，包含全局 Provider |
| `src/stores/index.ts` | Zustand 状态管理定义 |
| `src/lib/prisma.ts` | Prisma 客户端单例 |
| `prisma/schema.prisma` | 数据库模型定义 |
| `socket-server/src/index.ts` | Socket.io 服务端入口 |

---

## 代码规范

### TypeScript 规范

#### 1. 类型定义

```typescript
// 使用 interface 定义对象类型
interface User {
  id: string;
  username: string;
  email: string;
}

// 使用 type 定义联合类型或工具类型
type Status = 'online' | 'offline' | 'away';

// 避免使用 any，使用 unknown 替代
function processData(data: unknown) {
  if (typeof data === 'string') {
    // 类型收窄
  }
}
```

#### 2. 函数定义

```typescript
// 使用箭头函数
const handleSubmit = async (data: FormData) => {
  // ...
};

// 导出函数使用 export const
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};
```

#### 3. 组件定义

```typescript
// 使用函数组件
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary' 
}: ButtonProps) {
  return (
    <button 
      className={styles.button} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### React 规范

#### 1. Hooks 使用

```typescript
// 自定义 Hook 以 use 开头
export function useAISuggestion() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // 使用 useCallback 缓存函数
  const generateSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // ...
    } finally {
      setLoading(false);
    }
  }, [/* 依赖项 */]);

  return { suggestions, loading, generateSuggestions };
}
```

#### 2. 状态管理

```typescript
// Zustand Store 定义
interface ChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>;
  
  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  
  setCurrentConversation: (conversation) => 
    set({ currentConversation: conversation }),
    
  addMessage: (conversationId, message) => 
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
}));
```

### CSS 规范

#### 1. CSS Modules

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.button:hover {
  opacity: 0.9;
}

/* 变体使用 BEM 或修饰符 */
.primary {
  background: #3b82f6;
  color: white;
}

.secondary {
  background: #e5e7eb;
  color: #1f2937;
}
```

#### 2. 组件中使用

```typescript
import styles from './Button.module.css';

export function Button({ variant = 'primary' }) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]}`}
    >
      Click me
    </button>
  );
}
```

### API 路由规范

```typescript
// src/app/api/ai/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/suggestions
 * 生成对话建议
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求
    const body = await request.json();
    
    // 2. 验证参数
    if (!body.conversationId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: '缺少会话 ID' } },
        { status: 400 }
      );
    }
    
    // 3. 业务逻辑
    const suggestions = await aiService.generateSuggestions(body.conversationId);
    
    // 4. 返回响应
    return NextResponse.json({
      success: true,
      data: { suggestions },
    });
    
  } catch (error) {
    console.error('AI 建议生成错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
```

---

## 测试指南

### 测试框架

项目使用以下测试工具：
- **Jest**: 单元测试框架
- **Testing Library**: React 组件测试
- **Playwright**: E2E 测试

### 单元测试

#### 1. 测试文件命名

```
src/
├── hooks/
│   └── useAISuggestion.ts
└── __tests__/
    └── hooks/
        └── useAISuggestion.test.ts
```

#### 2. 测试示例

```typescript
// src/__tests__/hooks/useAISuggestion.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAISuggestion } from '@/hooks/useAISuggestion';

describe('useAISuggestion', () => {
  it('应该正确初始化状态', () => {
    const { result } = renderHook(() => useAISuggestion());
    
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('应该能生成建议', async () => {
    const { result } = renderHook(() => useAISuggestion());
    
    await act(async () => {
      await result.current.generateSuggestions('conv-123');
    });
    
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### E2E 测试

```typescript
// tests/cyberpunk-chat.spec.ts
import { test, expect } from '@playwright/test';

test('用户可以发送消息', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 登录
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待页面加载
  await page.waitForSelector('[data-testid="chat-area"]');
  
  // 发送消息
  await page.fill('textarea', 'Hello World');
  await page.click('button[aria-label="发送消息"]');
  
  // 验证消息已发送
  await expect(page.locator('.message-content')).toContainText('Hello World');
});
```

### 运行 E2E 测试

```bash
# 运行 Playwright 测试
npx playwright test

# 带界面运行
npx playwright test --ui
```

---

## 部署指南

### 生产环境配置

#### 1. 环境变量

```env
# 生产环境
DATABASE_URL="postgresql://user:password@prod-host:5432/nexus_chat"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="生产环境密钥-至少32字符"

# AI 配置
ALIBABA_API_KEY=your_production_key
AI_PROVIDER=alibaba
AI_DAILY_LIMIT=20
```

#### 2. 构建项目

```bash
# 安装依赖
npm ci

# 生成 Prisma 客户端
npm run db:generate

# 构建项目
npm run build
```

### Docker 部署

#### 1. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nexus:nexus123@db:5432/nexus_chat
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis

  socket-server:
    build: ./socket-server
    ports:
      - "3001:3001"
    depends_on:
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: nexus123
      POSTGRES_DB: nexus_chat
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 2. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 运行迁移
docker-compose exec app npm run db:migrate
```

### Vercel 部署

#### 1. 配置

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

#### 2. 环境变量

在 Vercel Dashboard 中配置：
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `ALIBABA_API_KEY`
- 其他必要的环境变量

#### 3. 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 数据库迁移

```bash
# 生产环境迁移
npm run db:migrate

# 或使用 Prisma
npx prisma migrate deploy
```

---

## 常见问题

### 1. 数据库连接失败

**问题**: `Error: Can't reach database server`

**解决方案**:
- 检查 PostgreSQL 是否运行
- 验证 `DATABASE_URL` 格式正确
- 确认数据库用户权限

```bash
# 测试数据库连接
npx prisma db pull
```

### 2. AI API 调用失败

**问题**: `AI_PROVIDER_ERROR` 或超时

**解决方案**:
- 检查 API Key 是否有效
- 验证网络连接
- 查看提供商服务状态

```bash
# 测试 API Key
npx tsx test-ai-key.ts
```

### 3. Socket.io 连接失败

**问题**: 前端无法连接到 Socket 服务

**解决方案**:
- 确认 Socket 服务已启动
- 检查 `NEXT_PUBLIC_SOCKET_URL` 配置
- 验证 CORS 设置

```typescript
// socket-server/src/index.ts
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
```

### 4. Prisma 客户端错误

**问题**: `PrismaClient is unable to run in this browser environment`

**解决方案**:
- 确保只在服务端使用 Prisma
- 使用正确的导入方式

```typescript
// 正确：服务端使用
import { prisma } from '@/lib/prisma';

// 错误：客户端使用
// Prisma 不能在客户端运行
```

### 5. 环境变量未生效

**问题**: 环境变量读取为 undefined

**解决方案**:
- 确认文件名为 `.env.local`（不是 `.env`）
- 重启开发服务器
- 检查变量名拼写

```bash
# 验证环境变量
node -e "console.log(process.env.ALIBABA_API_KEY)"
```

---

## 开发工作流

### 功能开发流程

1. **创建分支**

```bash
git checkout -b feature/ai-suggestion
```

2. **开发功能**

```bash
# 启动开发服务器
npm run dev
```

3. **编写测试**

```bash
npm run test
```

4. **代码检查**

```bash
npm run lint
npm run typecheck
```

5. **提交代码**

```bash
git add .
git commit -m "feat: 添加 AI 对话建议功能"
git push origin feature/ai-suggestion
```

### 提交信息规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

---

**文档版本历史**

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2026-02-22 | 初始版本 |

---

*文档结束*
