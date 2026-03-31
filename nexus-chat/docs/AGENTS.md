# Nexus Chat Agents

本文件记录项目中的 AI Agent 架构和配置。

## AI Agent 架构

Nexus Chat 使用多提供商 AI 架构来提供智能对话建议功能。

### 支持的 AI 提供商

| 提供商 | 模型 | 状态 | 免费额度 |
|--------|------|------|----------|
| 通义千问 (Alibaba) | qwen-plus / qwen-flash | 推荐 | 千万 tokens |
| DeepSeek | deepseek-chat | 备选 | 免费 |
| 智谱清言 (Zhipu) | glm-4-flash | 备选 | 免费 |
| OpenAI | gpt-4 | 降级 | 付费 |

### AI 功能

1. **智能建议**: 基于对话上下文生成 1-3 个回复建议
2. **一键使用**: 选择建议后可直接发送或编辑后发送
3. **用户反馈**: 支持点赞/点踩，帮助改进建议质量
4. **使用限制**: 每日 20 次免费使用
5. **隐私保护**: 数据脱敏处理，不永久存储对话内容

## 技术栈

- **AI SDK**: Vercel AI SDK
- **前端框架**: Next.js 14.1.0
- **状态管理**: Zustand
- **数据库**: PostgreSQL + Prisma

## API 端点

### 1. 生成对话建议

**端点**: `POST /api/ai/suggestions`

```typescript
// 请求参数
interface SuggestionsRequest {
  messages: AIMessageContext[];   // 消息上下文（必需）
  conversationId?: string;         // 会话 ID（可选）
  suggestionCount?: number;        // 建议数量 1-3（可选，默认 3）
  suggestionTypes?: string[];       // 建议类型（可选）
}

interface AIMessageContext {
  role: 'user' | 'assistant';
  content: string;
  senderId?: string;
}

// 响应参数
interface SuggestionsResponse {
  success: boolean;
  suggestions: AISuggestion[];
  provider: string;
  model: string;
  usageStats: {
    remaining: number;
    todayUsage: number;
    totalUsage: number;
  };
}

interface AISuggestion {
  id: string;
  content: string;
  type: 'reply' | 'question' | 'topic';
  confidence: number;
  createdAt: Date;
}
```

### 2. 获取使用统计

**端点**: `GET /api/ai/suggestions`

```typescript
// 响应参数
{
  usageStats: {
    userId: string;
    todayUsage: number;
    remainingUsage: number;
    totalUsage: number;
    lastUsedAt: Date | null;
  }
}
```

### 3. 提交用户反馈

**端点**: `POST /api/ai/feedback`

```typescript
// 请求参数
interface FeedbackRequest {
  suggestionId: string;            // 建议 ID（必需）
  feedbackType: 'positive' | 'negative';  // 反馈类型（必需）
  suggestionContent?: string;      // 建议内容（可选）
  conversationId?: string;         // 会话 ID（可选）
}

// 响应参数
interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    feedbackType: string;
  };
}
```

### 4. 获取 AI 配置

**端点**: `GET /api/ai/config`

```typescript
// 响应参数
{
  config: {
    provider: string;
    model: string;
    suggestionCount: number;
    dailyLimit: number;
    timeout: number;
    maxRetries: number;
  },
  provider: {
    name: string;
    models: string[];
  },
  limits: {
    maxMessagesPerRequest: number;     // 实际值为 20
    maxMessageLength: number;         // 实际值为 500
    minMessagesForSuggestion: number; // 实际值为 2
    maxSuggestionLength: number;      // 实际值为 100
    cacheTTL: number;                 // 实际值为 300000 (毫秒)
  },
  isValid: boolean,
  usageStats: {
    userId: string;
    todayUsage: number;
    remainingUsage: number;
    totalUsage: number;
    lastUsedAt: Date | null;
  }
}
```

## 配置

AI 功能可通过以下环境变量配置：

```env
# AI 提供商配置
AI_PROVIDER=alibaba              # 默认提供商
AI_MODEL=qwen-plus               # 默认模型
AI_SUGGESTION_COUNT=3            # 建议数量（1-3）
AI_DAILY_LIMIT=20                # 每日使用限制
AI_TIMEOUT=15000                 # 超时时间（毫秒）

# AI API Keys（至少配置一个）
ALIBABA_API_KEY=your_alibaba_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
ZHIPU_API_KEY=your_zhipu_api_key
OPENAI_API_KEY=your_openai_api_key

# Redis 配置（可选，用于缓存）
REDIS_URL=redis://localhost:6379
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `DAILY_LIMIT_EXCEEDED` | 429 | 每日使用次数已达上限 |
| `PROVIDER_UNAVAILABLE` | 500 | AI 服务提供商不可用 |
| `INVALID_PARAMS` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未授权 |

## 隐私声明

您的对话内容将被发送到 AI 服务以生成回复建议。我们承诺：
1. 不会永久存储您的对话内容
2. 不会将您的数据用于模型训练
3. 数据传输使用加密连接
4. 您可以随时在设置中关闭此功能

---

**最后更新**: 2026-02-23
