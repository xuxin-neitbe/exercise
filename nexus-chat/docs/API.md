# Nexus Chat API 文档

**版本**: 1.2  
**最后更新**: 2026-02-23

---

## 目录

1. [概述](#概述)
2. [认证](#认证)
3. [通用响应格式](#通用响应格式)
4. [AI 建议 API](#ai-建议-api)
5. [用户 API](#用户-api)
6. [会话 API](#会话-api)
7. [好友 API](#好友-api)
8. [错误码说明](#错误码说明)

---

## 概述

Nexus Chat API 基于 Next.js API Routes 实现，提供 RESTful 风格的接口。所有请求和响应均使用 JSON 格式。

### 基础 URL

```
开发环境: http://localhost:3000/api
生产环境: https://your-domain.com/api
```

### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>  # 需要认证的接口
```

---

## 认证

API 使用 NextAuth.js 进行认证。需要在请求头中携带 session cookie 或 token。

### 认证方式

1. **Session Cookie**: 浏览器自动携带
2. **Bearer Token**: 在 Authorization 头中携带

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

---

## AI 建议 API

### 1. 生成对话建议

生成基于对话上下文的 AI 回复建议。

**端点**: `POST /api/ai/suggestions`

#### 请求参数

```typescript
interface SuggestionsRequest {
  messages: AIMessageContext[];   // 消息上下文（必需）
  conversationId?: string;         // 会话 ID（可选）
  suggestionCount?: number;        // 建议数量 1-3（可选，默认 3）
  suggestionTypes?: string[];      // 建议类型（可选）
}

interface AIMessageContext {
  role: 'user' | 'assistant';     // 消息角色
  content: string;                // 消息内容
  senderId?: string;              // 发送者 ID（可选）
}
```

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/ai/suggestions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好", "senderId": "user-123"},
      {"role": "assistant", "content": "有什么可以帮你的吗？"}
    ],
    "conversationId": "conv-123",
    "suggestionCount": 3
  }'
```

#### 响应参数

```typescript
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

#### 成功响应示例

```json
{
  "success": true,
  "suggestions": [
    {
      "id": "sug-001",
      "content": "好的，我明白了。",
      "type": "reply",
      "confidence": 0.8,
      "createdAt": "2026-02-23T10:00:00.000Z"
    },
    {
      "id": "sug-002",
      "content": "收到！我这边正在处理。",
      "type": "reply",
      "confidence": 0.7,
      "createdAt": "2026-02-23T10:00:00.000Z"
    }
  ],
  "provider": "alibaba",
  "model": "qwen-plus",
  "usageStats": {
    "remaining": 18,
    "todayUsage": 2,
    "totalUsage": 15
  }
}
```

### 2. 获取使用统计

获取用户 AI 建议功能的使用统计。

**端点**: `GET /api/ai/suggestions`

#### 请求示例

```bash
curl -X GET http://localhost:3000/api/ai/suggestions \
  -H "Authorization: Bearer <token>"
```

#### 响应参数

```typescript
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

#### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "今日使用次数已达上限，请明天再试"
  }
}
```

---

### 3. 提交用户反馈

提交对 AI 建议的反馈。

**端点**: `POST /api/ai/feedback`

#### 请求参数

```typescript
interface FeedbackRequest {
  suggestionId: string;                      // 建议 ID（必需）
  feedbackType: 'positive' | 'negative';     // 反馈类型（必需）
  suggestionContent?: string;                 // 建议内容（可选）
  conversationId?: string;                    // 会话 ID（可选）
}
```

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/ai/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "suggestionId": "sug-001",
    "feedbackType": "positive"
  }'
```

#### 响应参数

```typescript
interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    feedbackType: string;
  };
}
```

#### 成功响应示例

```json
{
  "success": true,
  "message": "感谢您的反馈",
  "feedback": {
    "id": "feedback-001",
    "feedbackType": "positive"
  }
}
```

#### 反馈类型说明

| FeedbackType | 说明 |
|--------------|------|
| `positive` | 用户点赞建议 |
| `negative` | 用户点踩建议 |

---

### 4. 获取 AI 配置

获取当前用户的 AI 功能配置信息。

**端点**: `GET /api/ai/config`

#### 请求示例

```bash
curl -X GET http://localhost:3000/api/ai/config \
  -H "Authorization: Bearer <token>"
```

#### 响应参数

```typescript
interface AIConfigResponse {
  config: {
    provider: string;
    model: string;
    suggestionCount: number;
    dailyLimit: number;
    timeout: number;
    maxRetries: number;
  };
  provider: {
    name: string;
    models: string[];
  };
  limits: {
    maxMessagesPerRequest: number;
    maxMessageLength: number;
    minMessagesForSuggestion: number;  // 实际值为 2
    maxSuggestionLength: number;
    cacheTTL: number;
  };
  isValid: boolean;
  usageStats: {
    userId: string;
    todayUsage: number;
    remainingUsage: number;
    totalUsage: number;
    lastUsedAt: Date | null;
  };
}
```

#### 成功响应示例

```json
{
  "config": {
    "provider": "alibaba",
    "model": "qwen-plus",
    "suggestionCount": 3,
    "dailyLimit": 20,
    "timeout": 15000,
    "maxRetries": 3
  },
  "provider": {
    "name": "alibaba",
    "models": ["qwen-plus", "qwen-flash"]
  },
  "limits": {
    "maxMessagesPerRequest": 20,
    "maxMessageLength": 500,
    "minMessagesForSuggestion": 2,
    "maxSuggestionLength": 100,
    "cacheTTL": 300000
  },
  "isValid": true,
  "usageStats": {
    "userId": "user-001",
    "todayUsage": 1,
    "remainingUsage": 19,
    "totalUsage": 15,
    "lastUsedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

---

## 用户 API

### 1. 用户注册

**端点**: `POST /api/auth/register`

#### 请求参数

```typescript
interface RegisterRequest {
  username: string;    // 用户名
  email: string;       // 邮箱
  password: string;    // 密码
}
```

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-001",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

---

### 2. 获取用户资料

**端点**: `GET /api/users/profile`

#### 请求示例

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "id": "user-001",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 3. 更新用户资料

**端点**: `PUT /api/users/profile`

#### 请求参数

```typescript
interface UpdateProfileRequest {
  username?: string;    // 用户名
  avatar?: string;      // 头像 URL
}
```

---

### 4. 上传用户头像

上传并更新用户头像。

**端点**: `POST /api/users/avatar`

#### 请求格式

`Content-Type: multipart/form-data`

#### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| avatar | File | 是 | 头像图片文件（支持 JPG, PNG, WebP） |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/users/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg"
```

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/user-001/avatar-123.jpg",
    "message": "头像上传成功"
  }
}
```

#### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "仅支持 JPG、PNG、WebP 格式的图片"
  }
}
```

---

### 5. 搜索用户

**端点**: `GET /api/users/search?keyword=<keyword>`

#### 请求示例

```bash
curl -X GET "http://localhost:3000/api/users/search?keyword=test" \
  -H "Authorization: Bearer <token>"
```

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-002",
        "username": "testuser2",
        "email": "test2@example.com",
        "avatar": null
      }
    ]
  }
}
```

---

## 会话 API

### 6. 获取会话列表

**端点**: `GET /api/conversations`

#### 请求示例

```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer <token>"
```

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-001",
        "name": null,
        "isGroup": false,
        "participants": [
          {
            "id": "user-002",
            "username": "friend1"
          }
        ],
        "lastMessage": {
          "content": "你好",
          "createdAt": "2026-02-22T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

## 好友 API

### 7. 获取好友列表

**端点**: `GET /api/friends`

#### 成功响应示例

```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "user-002",
        "username": "friend1",
        "status": "online"
      }
    ]
  }
}
```

---

### 8. 发送好友请求

**端点**: `POST /api/friends/requests`

#### 请求参数

```typescript
interface FriendRequestRequest {
  friendId: string;    // 好友用户 ID
}
```

---

### 9. 接受好友请求

**端点**: `POST /api/friends/accept`

#### 请求参数

```typescript
interface AcceptFriendRequest {
  requestId: string;    // 请求 ID
}
```

---

### 10. 删除好友

**端点**: `DELETE /api/friends?friendId=<friendId>`

---

## 错误码说明

### AI 相关错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `DAILY_LIMIT_EXCEEDED` | 429 | 今日使用次数已达上限 |
| `NO_CONTEXT` | 400 | 没有可用的对话上下文 |
| `PROVIDER_UNAVAILABLE` | 500 | AI 服务暂时不可用 |
| `INVALID_PARAMS` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未授权，请先登录 |

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `UNAUTHORIZED` | 401 | 未授权，请先登录 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "今日使用次数已达上限，请明天再试",
    "details": {
      "limit": 20,
      "used": 20,
      "resetAt": "2026-02-23T00:00:00.000Z"
    }
  }
}
```

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 生成 AI 建议
async function generateSuggestions(conversationId: string) {
  const response = await fetch('/api/ai/suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId,
      messageCount: 10,
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
}

// 提交反馈
async function submitFeedback(
  suggestionId: string,
  conversationId: string,
  action: 'like' | 'dislike' | 'use' | 'ignore'
) {
  const response = await fetch('/api/ai/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      suggestionId,
      conversationId,
      action,
    }),
  });

  return response.json();
}
```

### React Hook 示例

```typescript
import { useState, useCallback } from 'react';

interface AISuggestion {
  id: string;
  content: string;
  reasoning?: string;
}

export function useAISuggestion() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSuggestions(data.data.suggestions);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成建议失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(async (
    suggestionId: string,
    conversationId: string,
    action: 'like' | 'dislike' | 'use' | 'ignore'
  ) => {
    const response = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId, conversationId, action }),
    });

    return response.json();
  }, []);

  return {
    suggestions,
    loading,
    error,
    generateSuggestions,
    submitFeedback,
  };
}
```

---

## 最佳实践

### 1. 错误处理

始终检查响应中的 `success` 字段，并妥善处理错误情况：

```typescript
const response = await fetch('/api/ai/suggestions', { /* ... */ });
const data = await response.json();

if (!data.success) {
  // 根据错误码处理不同错误
  switch (data.error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      // 显示剩余时间
      break;
    case 'AI_PROVIDER_ERROR':
      // 显示降级提示
      break;
    default:
      // 显示通用错误
  }
  return;
}

// 处理成功响应
console.log(data.data.suggestions);
```

### 2. 频率限制处理

在调用 AI API 前，先检查剩余次数：

```typescript
// 获取配置
const configResponse = await fetch('/api/ai/config');
const config = await configResponse.json();

if (config.data.remainingToday <= 0) {
  // 显示提示：今日次数已用完
  return;
}

// 继续调用建议 API
```

### 3. 缓存利用

利用 `cached` 字段判断是否来自缓存，优化用户体验：

```typescript
const data = await generateSuggestions(conversationId);

if (data.cached) {
  // 显示"已从缓存加载"提示
  // 缓存结果通常更快
}
```

---

**文档版本历史**

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.2 | 2026-02-23 | 补充头像上传 API 文档 |
| 1.1 | 2026-02-23 | 更新 AI API 参数，添加 GET /api/ai/suggestions 端点 |
| 1.0 | 2026-02-22 | 初始版本 |

---

*文档结束*
