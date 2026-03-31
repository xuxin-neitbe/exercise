/**
 * AI 对话建议功能类型定义
 * 定义 AI 服务相关的接口和类型
 */

/**
 * AI 建议内容
 * 表示单个对话建议的完整信息
 */
export interface AISuggestion {
  /** 建议的唯一标识符 */
  id: string
  /** 建议的文本内容 */
  content: string
  /** 建议的类型：问题、回复、话题 */
  type: 'question' | 'reply' | 'topic'
  /** 置信度分数 (0-1)，越高表示越相关 */
  confidence: number
  /** 建议的创建时间 */
  createdAt: Date
}

/**
 * AI 建议请求参数
 * 用于请求生成对话建议
 */
export interface AISuggestionRequest {
  /** 当前对话的上下文消息列表 */
  messages: AIMessageContext[]
  /** 当前用户 ID（可选，API 从 session 自动获取） */
  userId?: string
  /** 对话 ID（可选） */
  conversationId?: string
  /** 请求的建议数量 (1-3) */
  suggestionCount?: number
  /** 建议类型过滤（可选） */
  suggestionTypes?: AISuggestion['type'][]
}

/**
 * AI 消息上下文
 * 用于构建 AI 请求的对话历史
 */
export interface AIMessageContext {
  /** 消息发送者 ID */
  senderId: string
  /** 消息发送者名称 */
  senderName?: string
  /** 消息内容 */
  content: string
  /** 消息发送时间 */
  timestamp: Date
  /** 是否为当前用户发送 */
  isCurrentUser: boolean
}

/**
 * AI 建议响应
 * AI 服务返回的建议结果
 */
export interface AISuggestionResponse {
  /** 是否成功生成建议 */
  success: boolean
  /** 生成的建议列表 */
  suggestions: AISuggestion[]
  /** 错误信息（如果失败） */
  error?: string
  /** 使用的 AI 提供商 */
  provider: AIProviderType
  /** 使用的模型名称 */
  model: string
  /** API 调用耗时（毫秒） */
  duration: number
  /** Token 使用量（可选） */
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
}

/**
 * AI 提供商类型
 */
export type AIProviderType = 'alibaba' | 'deepseek' | 'zhipu' | 'openai'

/**
 * AI 提供商接口
 * 定义 AI 提供商的通用方法
 */
export interface AIProvider {
  /** 提供商名称 */
  name: AIProviderType
  /** 生成对话建议 */
  generateSuggestions(request: AISuggestionRequest): Promise<AISuggestionResponse>
  /** 检查提供商是否可用 */
  isAvailable(): Promise<boolean>
}

/**
 * AI 配置选项
 */
export interface AIConfig {
  /** 当前使用的提供商 */
  provider: AIProviderType
  /** 模型名称 */
  model: string
  /** API Key */
  apiKey: string
  /** 建议数量 */
  suggestionCount: number
  /** 每日使用限制 */
  dailyLimit: number
  /** 超时时间（毫秒） */
  timeout: number
  /** 最大重试次数 */
  maxRetries: number
}

/**
 * AI 使用统计
 */
export interface AIUsageStats {
  /** 用户 ID */
  userId: string
  /** 今日已使用次数 */
  todayUsage: number
  /** 今日剩余次数 */
  remainingUsage: number
  /** 总计使用次数 */
  totalUsage: number
  /** 最后使用时间 */
  lastUsedAt: Date | null
}

/**
 * AI 错误类型
 */
export type AIErrorType =
  | 'RATE_LIMIT_EXCEEDED' // 超过频率限制
  | 'DAILY_LIMIT_EXCEEDED' // 超过每日限制
  | 'TIMEOUT' // 请求超时
  | 'API_ERROR' // API 错误
  | 'INVALID_RESPONSE' // 响应格式错误
  | 'PROVIDER_UNAVAILABLE' // 提供商不可用
  | 'UNKNOWN' // 未知错误

/**
 * AI 错误信息
 */
export interface AIError {
  /** 错误类型 */
  type: AIErrorType
  /** 错误消息 */
  message: string
  /** 原始错误（可选） */
  originalError?: Error
  /** 是否可重试 */
  retryable: boolean
}
