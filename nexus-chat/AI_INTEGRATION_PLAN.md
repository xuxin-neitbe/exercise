# Nexus_Chat AI 集成计划

> **版本**: 3.0
> **最后更新**: 2026-02-24
> **状态**: 已更新为实际实现版本

---

## 一、项目概述

### 1.1 当前项目技术栈
- **前端框架**: Next.js 14 + React 18
- **状态管理**: Zustand
- **实时通信**: Socket.io Client
- **数据库**: Prisma ORM + PostgreSQL
- **认证**: NextAuth.js
- **样式**: CSS Modules

### 1.2 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── conversations/  # 会话相关 API
│   │   ├── friends/        # 好友相关 API
│   │   ├── ai/            # AI 相关 API
│   │   │   ├── suggestions/  # 建议生成 API
│   │   │   ├── feedback/    # 用户反馈 API
│   │   │   └── config/      # 配置查询 API
│   │   └── auth/          # 认证相关 API
├── components/
│   ├── chat/              # 聊天相关组件
│   │   ├── ChatArea.tsx   # 聊天区域
│   │   ├── FriendList.tsx # 好友列表
│   │   └── Sidebar.tsx    # 侧边栏
│   └── ui/                # 通用 UI 组件
├── hooks/                 # 自定义 Hooks
│   └── useAISuggestion.ts # AI 建议 Hook
├── lib/                   # 工具库
│   └── ai/                # AI 相关
│       ├── config.ts           # 配置
│       └── prompt-templates.ts # 提示词模板
├── services/              # 业务逻辑层
│   └── ai/               # AI 服务层（备用，未使用）
├── stores/                # Zustand 状态管理
├── repositories/           # 数据访问层
└── types/                 # TypeScript 类型定义
```

---

## 二、AI 功能需求

### 2.1 核心功能：智能对话建议

**功能描述**：
在用户输入消息时，点击"帮我回答"按钮，AI 根据当前对话上下文提供回复建议，用户可以选择其中一个建议直接发送或编辑后发送。

**使用场景**：
1. 用户不知道如何回复时，获取 AI 建议
2. 用户想获得更礼貌或更有趣的回复
3. 用户需要快速回复多个消息时

### 2.2 功能特性（V1 版本）

| 特性 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 上下文感知 | 基于最近消息生成建议 | P0 | ✅ 已完成 |
| 建议生成 | 一次生成 **1-3 个**建议 | P0 | ✅ 已完成 |
| 可编辑发送 | 用户可以编辑建议后再发送 | P0 | ✅ 已完成 |
| 用户反馈 | 点赞/点踩机制 | P0 | ✅ 已完成 |
| 使用限制 | 每日 **20 次**使用限制 | P0 | ✅ 已完成 |
| 隐私声明 | 明确数据处理方式 | P0 | ✅ 已完成 |
| 降级方案 | API 失败时显示预设建议 | P0 | ✅ 已完成 |
| 加载优化 | 显示加载状态 | P1 | ✅ 已完成 |
| 重新生成 | 提供重新生成按钮 | P1 | ✅ 已完成 |
| 使用统计 | 记录使用数据用于分析 | P1 | ✅ 已完成 |

### 2.3 V1 版本不做功能

以下功能将在后续版本中实现：

| 功能 | 移除理由 |
|------|----------|
| ~~建议分类~~ | 增加复杂度，用户场景不明确 |
| ~~历史记录~~ | V1 非必要，涉及隐私问题 |
| ~~个性化建议~~ | V1 数据量不足，属于 V2 功能 |
| ~~多语言支持~~ | 属于 V2 功能 |
| ~~流式生成~~ | 属于 V2 功能 |
| ~~Redis 缓存~~ | V1 使用内存缓存即可 |
| ~~多提供商切换~~ | 属于 V2 功能 |

---

## 三、技术架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (Next.js)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  ChatArea    │─────▶│  AI Suggestion│                    │
│  │  Component   │      │  Panel       │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────────────┐              │
│  │         useAISuggestion Hook             │              │
│  └──────────────────────────────────────────┘              │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes                             │
├─────────────────────────────────────────────────────────────┤
│  POST /api/ai/suggestions    - 生成建议                   │
│  POST /api/ai/feedback       - 用户反馈                   │
│  GET  /api/ai/config         - 配置查询                    │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              提示词处理层                                   │
├─────────────────────────────────────────────────────────────┤
│  - prompt-templates.ts (提示词模板)                        │
│  - 安全检查 (detectMaliciousInput)                         │
│  - 内容过滤 (filterUnsafeContent)                          │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AI API (直接调用)                               │
├─────────────────────────────────────────────────────────────┤
│  通义千问 API: dashscope.aliyuncs.com                     │
│  模型: qwen-flash (默认)                                   │
└─────────────────────────────────────────────────────────────┘
```

> **注意**: 本项目**不使用** Vercel AI SDK，而是使用原生 `fetch` 直接调用 AI 提供商 API。

### 3.2 数据流

```
用户点击"AI建议"按钮
    │
    ▼
检查用户登录状态
    │
    ├── 未登录 → 返回 401
    │
    └── 已登录 → 检查每日使用限制
                    │
                    ├── 超过限制 → 返回 429，显示"今日次数已用完"
                    │
                    └── 未超过 → 收集最近消息（最多20条）
                                    │
                                    ▼
                                安全检查（恶意输入检测）
                                    │
                                    ├── 检测到恶意 → 返回安全默认建议
                                    │
                                    └── 通过 → 构建提示词
                                                    │
                                                    ▼
                                                调用通义千问 API
                                                (dashscope.aliyuncs.com)
                                                    │
                                                    ▼
                                                解析 JSON 响应
                                                    │
                                                    ▼
                                                验证输出格式
                                                    │
                                                    ├── 格式无效 → 返回默认建议
                                                    │
                                                    └── 格式有效 → 内容安全过滤
                                                                    │
                                                                    ▼
                                                                返回建议给前端
                                                                    │
                                                                    ▼
                                                                记录使用次数
```

### 3.3 模块结构（实际实现）

```
src/
├── app/api/ai/                    # AI 相关 API 路由（核心实现）
│   ├── suggestions/
│   │   ├── route.ts               # 建议生成 API（核心，使用原生 fetch）
│   │   └── __tests__/route.test.ts
│   ├── feedback/
│   │   ├── route.ts               # 用户反馈 API
│   │   └── __tests__/
│   └── config/
│       ├── route.ts               # 配置查询 API
│       └── __tests__/
│
├── lib/ai/                        # AI 工具库
│   ├── config.ts                   # 配置常量（定义多提供商映射）
│   └── prompt-templates.ts        # 提示词模板
│
├── hooks/                         # React Hooks
│   └── useAISuggestion.ts         # AI 建议 Hook
│
├── services/ai/                   # AI 服务层（备用层，当前未被 route.ts 使用）
│   └── ai-service.ts              # AI 服务类（备用）
│
└── types/
    └── ai.ts                      # AI 类型定义
```

> **注意**: 核心 AI 调用逻辑直接在 `src/app/api/ai/suggestions/route.ts` 中实现，使用原生 fetch 调用通义千问 API。`services/ai/` 目录作为备用层，当前未被使用。

### 3.4 提示词结构

#### System Prompt
```markdown
你是一个专业的聊天助手，专门帮助用户生成合适的对话回复建议。

## 核心能力
- 分析对话上下文，理解对话意图和情感
- 生成自然、得体、相关的回复建议
- 提供多种类型的建议：直接回复、追问、话题延伸

## 行为准则
1. 只生成积极、友好、安全的回复内容
2. 不生成任何有害、违法、歧视性或不当内容
3. 不泄露或传播用户隐私信息
4. 保持建议的中立性和建设性
5. 始终以 JSON 数组格式返回结果
```

#### User Prompt
```markdown
## 对话上下文
以下是最近的对话记录：
[我]: 用户消息
[对方]: 对方消息

## 任务要求
请根据上述对话内容，生成 N 个合适的回复建议。

### 输出格式
[{"content": "建议内容", "type": "reply|question|topic", "confidence": 0.9}]
```

---

## 四、API 设计

### 4.1 生成建议 API

**端点**: `POST /api/ai/suggestions`

```typescript
// 请求体
interface SuggestionsRequest {
  messages: AIMessageContext[]      // 消息上下文
  conversationId?: string           // 会话 ID
  suggestionCount?: number          // 建议数量 (1-3)
}

// 响应体
interface SuggestionsResponse {
  success: boolean
  suggestions: AISuggestion[]        // AI 建议列表
  provider: string                   // 提供商 (alibaba)
  model: string                      // 模型名称
  usageStats: {
    remaining: number                // 剩余次数
    todayUsage: number               // 今日使用次数
    totalUsage: number               // 总使用次数
  }
}
```

### 4.2 用户反馈 API

**端点**: `POST /api/ai/feedback`

```typescript
// 请求体
interface FeedbackRequest {
  suggestionId: string              // 建议 ID
  feedbackType: 'positive' | 'negative'  // 反馈类型
  suggestionContent?: string        // 建议内容（可选）
}

// 响应体
interface FeedbackResponse {
  success: boolean
  message: string
}
```

### 4.3 配置查询 API

**端点**: `GET /api/ai/config`

```typescript
// 响应体
interface AIConfigResponse {
  success: boolean
  data: {
    dailyLimit: number              // 每日限制次数
    usedToday: number               // 今日已使用次数
    remainingToday: number           // 今日剩余次数
    provider: string                // 当前提供商
    privacyNotice: string           // 隐私声明
  }
}
```

---

## 五、数据库设计

### 5.1 Prisma Schema

```prisma
// AI 建议使用记录
model AISuggestionUsage {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  usageDate      DateTime @map("usage_date") @db.Date
  count          Int      @default(0)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, usageDate])
  @@index([userId])
  @@map("ai_suggestion_usage")
}

// AI 建议反馈
model AISuggestionFeedback {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  suggestionId   String   @map("suggestion_id")
  conversationId String   @map("conversation_id")
  action         String   // positive, negative
  createdAt      DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([suggestionId])
  @@map("ai_suggestion_feedback")
}
```

---

## 六、隐私与安全

### 6.1 隐私声明

```
您的对话内容将被发送到 AI 服务以生成回复建议。

我们承诺：
1. 不会永久存储您的对话内容
2. 不会将您的数据用于模型训练
3. 数据传输使用加密连接
4. 您可以随时在设置中关闭此功能
```

### 6.2 安全措施

| 安全措施 | 说明 | 状态 |
|----------|------|------|
| 登录验证 | 检查用户 session | ✅ |
| 每日限额 | 每日 20 次限制 | ✅ |
| 恶意输入检测 | detectMaliciousInput() | ✅ |
| 内容安全过滤 | filterUnsafeContent() | ✅ |
| 输出格式验证 | validateSuggestionOutput() | ✅ |
| 提示词注入防护 | sanitizeContent() | ✅ |

### 6.3 频率限制

- 每日限制：**20 次/用户**
- 重置时间：每日 0 点
- 超限提示：显示"今日使用次数已达上限"

---

## 七、降级方案

### 7.1 降级策略

| 级别 | 触发条件 | 处理方式 |
|------|----------|----------|
| Level 1 | API 返回错误 | 返回预设建议 |
| Level 2 | 响应格式无效 | 返回安全默认建议 |
| Level 3 | 安全检查失败 | 返回安全默认建议 |
| Level 4 | 完全不可用 | 显示友好错误提示 |

### 7.2 预设建议模板

```typescript
const DEFAULT_SUGGESTIONS = [
  { content: '好的，我明白了。', type: 'reply', confidence: 0.5 },
  { content: '谢谢你的分享。', type: 'reply', confidence: 0.5 },
  { content: '听起来不错！', type: 'reply', confidence: 0.5 },
]
```

---

## 八、环境变量配置

```env
# ========================================
# AI 提供商 API Key 配置
# ========================================

# 阿里云通义千问（当前唯一已实现的提供商）
# 获取地址: https://modelstudio.console.alibabacloud.com/
# 免费额度: 新用户千万 tokens
ALIBABA_API_KEY=your_alibaba_api_key_here

# ========================================
# AI 模型配置
# ========================================

# 默认使用的提供商（当前仅支持 alibaba）
AI_PROVIDER=alibaba

# 默认模型名称
# 当前已实现: qwen-flash
AI_MODEL=qwen-flash

# 建议数量（1-3）
AI_SUGGESTION_COUNT=3

# 每日使用限制
AI_DAILY_LIMIT=20

# API 超时时间（毫秒）
AI_TIMEOUT=10000

# 最大重试次数
AI_MAX_RETRIES=2
```

> **注意**: 虽然代码中定义了 DEEPSEEK_API_KEY、ZHIPU_API_KEY、OPENAI_API_KEY 等环境变量，但当前实现仅支持阿里云通义千问。这些备用提供商的切换功能将在后续版本中实现。

---

## 九、技术选型

### 9.1 AI 调用方式

| 方式 | 状态 | 说明 |
|------|------|------|
| 原生 fetch | ✅ 已实现 | 直接调用通义千问 API |
| Vercel AI SDK | ❌ 未使用 | 当前不需要 |
| LangChain | ❌ 未使用 | 不需要 |

### 9.2 AI 提供商（当前仅支持）

| 提供商 | 模型 | 免费额度 | 状态 |
|--------|------|----------|------|
| 阿里云通义千问 | qwen-flash | 千万 tokens | ✅ 已实现 |
| DeepSeek | - | - | ❌ 未实现 |
| 智谱清言 | - | - | ❌ 未实现 |
| OpenAI | - | - | ❌ 未实现 |

> **说明**: 虽然 `src/lib/ai/config.ts` 中定义了多提供商配置映射，但当前 `route.ts` 仅实现了阿里云通义千问的调用逻辑。

---

## 十、实际代码调用流程

### 10.1 后端 API 调用

```typescript
// src/app/api/ai/suggestions/route.ts

// 1. 构建提示词
const { systemPrompt, userPrompt } = buildCompletePrompt(messages, count, {
  includeFewShot: true,
  strictMode: true,
})

// 2. 调用通义千问 API
const response = await fetch(
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-flash',
      input: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      parameters: {
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
  }
)
```

### 10.2 前端调用

```typescript
// src/hooks/useAISuggestion.ts

const { generate, suggestions, loading } = useAISuggestion()

// 调用
await generate({
  messages: conversationMessages,
  conversationId: 'xxx',
})
```

---

## 附录：文件清单

### 核心文件（实际使用）

| 文件路径 | 说明 |
|----------|------|
| `src/app/api/ai/suggestions/route.ts` | 建议生成 API（核心，使用原生 fetch 直接调用通义千问） |
| `src/app/api/ai/feedback/route.ts` | 用户反馈 API |
| `src/app/api/ai/config/route.ts` | 配置查询 API |
| `src/lib/ai/config.ts` | AI 配置常量 |
| `src/lib/ai/prompt-templates.ts` | 提示词模板 |
| `src/hooks/useAISuggestion.ts` | AI 建议 Hook |
| `src/types/ai.ts` | AI 类型定义 |

### 备用文件（当前未使用）

| 文件路径 | 说明 |
|----------|------|
| `src/services/ai/ai-service.ts` | AI 服务类（作为备用层，当前未被 route.ts 使用） |

---

**文档版本历史**

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2026-02-20 | 初始版本 |
| 2.0 | 2026-02-22 | 根据产品审查报告和架构设计更新 |
| 3.0 | 2026-02-24 | 更新为实际实现版本，移除未实现的功能描述 |
| 3.1 | 2026-02-24 | 明确仅支持阿里云通义千问，澄清 services/ai/ 为备用层 |
