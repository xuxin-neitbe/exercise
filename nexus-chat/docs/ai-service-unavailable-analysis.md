# AI 服务不可用问题分析报告

## 问题描述

用户在对话窗口点击"帮我回答"按钮时，弹出"AI服务暂时不可用，请稍后再试"的错误提示。

---

## 一、完整调用链路图

```
用户点击 "帮我回答" 按钮
         │
         ▼
┌─────────────────────────────────────┐
│  AISuggestionButton.tsx (前端组件)   │
│  - 触发 onClick 回调                 │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  useAISuggestion.ts (前端 Hook)      │
│  - 检查隐私声明                       │
│  - 验证消息数量 (>=2)                 │
│  - 调用 aiService.generateSuggestions│
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ai-service.ts (前端服务层)          │
│  - 准备请求数据                       │
│  - 发送 POST 请求到 /api/ai/suggestions│
│  - 处理响应/错误                      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /api/ai/suggestions/route.ts (后端) │
│  1. 验证用户登录状态 (session)        │
│  2. 验证 AI 配置 (isAIConfigValid)   │
│  3. 验证请求参数                      │
│  4. 检查使用限制                      │
│  5. 调用通义千问 API                  │
│  6. 记录使用次数                      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  通义千问 API (外部服务)              │
│  - https://dashscope.aliyuncs.com/...│
└─────────────────────────────────────┘
```

---

## 二、错误来源分析

错误消息 **"AI服务暂时不可用，请稍后再试"** 对应 `src/lib/ai/config.ts:114` 中的 `AI_ERROR_MESSAGES.API_ERROR`。

### 可能的触发点：

| 序号 | 触发位置 | 触发条件 | 错误消息 |
|------|----------|----------|----------|
| **1** | route.ts:80-86 | `isAIConfigValid()` 返回 `false` | "AI 提供商服务不可用" |
| **2** | route.ts:355-359 | 通义千问 API 返回非 200 状态码 | "AI 服务暂时不可用，请稍后重试" |
| **3** | ai-service.ts:183-214 | 前端收到非 200 响应 | 根据错误类型返回对应消息 |

---

## 三、最可能的原因分析

### 原因 1：API Key 未配置（最可能 ⭐）

**问题定位：**

查看 `.env` 文件：
```env
ALIBABA_API_KEY=your_alibaba_api_key_here
```

**分析：**
- 环境变量中的 `ALIBABA_API_KEY` 值是占位符 `your_alibaba_api_key_here`
- `config.ts:20` 中：`apiKey: process.env.ALIBABA_API_KEY || ''`
- `config.ts:125-127` 中 `isAIConfigValid()` 检查：
  ```typescript
  export function isAIConfigValid(): boolean {
    return Boolean(AI_CONFIG.apiKey && AI_CONFIG.apiKey.length > 0)
  }
  ```
- 虽然占位符字符串长度 > 0，但它不是有效的 API Key

**后端处理逻辑** (route.ts:79-86)：
```typescript
// 验证 AI 配置
if (!isAIConfigValid()) {
  console.log('[API] AI config invalid - no API key')
  return NextResponse.json(
    { error: AI_ERROR_MESSAGES.PROVIDER_UNAVAILABLE },  // "AI 提供商服务不可用"
    { status: 500 }
  )
}
```

---

### 原因 2：通义千问 API 调用失败

**问题定位：**

route.ts:327-359 中的 API 调用：

```typescript
const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,  // 使用无效的 API Key
  },
  // ...
})

if (!response.ok) {
  const errorText = await response.text()
  console.error('AI API 错误:', errorText)
  throw new Error(AI_ERROR_MESSAGES.API_ERROR)  // "AI 服务暂时不可用，请稍后重试"
}
```

**可能的失败原因：**
1. API Key 无效或过期
2. API Key 权限不足
3. 账户余额不足
4. 请求频率超限
5. 网络连接问题

---

### 原因 3：用户未登录

**问题定位：**

route.ts:67-77：

```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json(
    { error: '未登录' },
    { status: 401 }
  )
}
```

**分析：** 这会返回 "未登录" 错误，不是 "AI服务暂时不可用"。

---

### 原因 4：请求超时

**问题定位：**

route.ts:352：
```typescript
signal: AbortSignal.timeout(AI_CONFIG.timeout),  // 默认 10000ms
```

ai-service.ts:225-227：
```typescript
if (error.name === 'AbortError') {
  errorMessage = AI_ERROR_MESSAGES.TIMEOUT  // "AI 服务响应超时，请稍后重试"
}
```

**分析：** 超时会返回 "AI 服务响应超时"，不是 "AI服务暂时不可用"。

---

## 四、诊断建议

### 步骤 1：检查环境变量配置

**解决方案：**
1. 访问 [阿里云模型服务控制台](https://modelstudio.console.alibabacloud.com/)
2. 获取有效的 API Key
3. 更新 `.env` 文件：
   ```env
   ALIBABA_API_KEY=sk-xxxxxxxxxxxxxxxx  # 替换为真实的 API Key
   ```
4. 重启开发服务器

---

### 步骤 2：检查控制台日志

查看后端控制台输出，确认错误来源：

```
[API] POST /api/ai/suggestions called
[API] Session: { userId: 'xxx' } 或 No session
[API] AI config invalid - no API key  ← 如果看到这个，说明 API Key 未配置
AI API 错误: xxx  ← 如果看到这个，说明通义千问 API 调用失败
```

---

### 步骤 3：检查浏览器开发者工具

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 点击 "帮我回答" 按钮
4. 查看 `/api/ai/suggestions` 请求的响应

**可能的响应：**

| 状态码 | 响应内容 | 原因 |
|--------|----------|------|
| 401 | `{ error: '未登录' }` | 用户未登录 |
| 429 | `{ error: '今日使用次数已达上限...' }` | 超过每日限制 |
| 500 | `{ error: 'AI 提供商服务不可用' }` | API Key 未配置 |
| 500 | `{ error: 'AI 服务暂时不可用，请稍后重试' }` | 通义千问 API 调用失败 |

---

### 步骤 4：验证数据库连接

确认 `AISuggestionUsage` 表是否存在：

```bash
# 运行 Prisma 迁移
npx prisma migrate dev

# 或推送 schema
npx prisma db push
```

---

## 五、总结

### 最可能的原因排序：

| 优先级 | 原因 | 解决方案 |
|--------|------|----------|
| **1 (最高)** | `ALIBABA_API_KEY` 使用占位符，未配置真实 API Key | 获取并配置有效的阿里云 API Key |
| **2** | API Key 有效但通义千问 API 调用失败 | 检查账户余额、权限配置 |
| **3** | 数据库表 `AISuggestionUsage` 不存在 | 运行 `npx prisma db push` |
| **4** | 网络问题导致无法访问通义千问 API | 检查网络连接 |

---

## 六、结论

**根本原因：`.env` 文件中的 `ALIBABA_API_KEY` 使用的是占位符 `your_alibaba_api_key_here`，不是有效的 API Key。**

当后端调用通义千问 API 时，由于 API Key 无效，阿里云返回错误响应，导致前端显示"AI服务暂时不可用，请稍后再试"。

**解决方案：**
1. 前往阿里云模型服务控制台获取有效的 API Key
2. 更新 `.env` 文件中的 `ALIBABA_API_KEY`
3. 重启开发服务器
