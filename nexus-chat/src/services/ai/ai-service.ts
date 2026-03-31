/**
 * AI 服务类
 *
 * 提供 AI 建议生成的核心功能
 */

import {
  AI_CONFIG,
  AI_ERROR_MESSAGES,
  AI_LIMITS,
} from '@/lib/ai/config'
import type {
  AISuggestion,
  AISuggestionRequest,
  AISuggestionResponse,
} from '@/types/ai'

/**
 * AI 服务类
 * 负责与 AI API 交互，生成对话建议
 */
export class AIService {
  /**
   * 生成对话建议
   * @param request 请求参数
   * @returns AI 建议响应
   */
  async generateSuggestions(
    request: AISuggestionRequest
  ): Promise<AISuggestionResponse> {
    const startTime = Date.now()

    try {
      // 验证请求参数
      const validationError = this.validateRequest(request)
      if (validationError) {
        return {
          success: false,
          suggestions: [],
          error: validationError,
          provider: AI_CONFIG.provider,
          model: AI_CONFIG.model,
          duration: Date.now() - startTime,
        }
      }

      // 准备请求数据
      const requestData = this.prepareRequestData(request)

      // 调用 API
      const response = await this.callAPI(requestData)

      // 处理响应
      return this.handleResponse(response, startTime)
    } catch (error) {
      return this.handleError(error as Error, startTime)
    }
  }

  /**
   * 验证请求参数
   * 注意：userId 由 API 端从 session 获取，前端不需要传递
   */
  private validateRequest(request: AISuggestionRequest): string | null {
    // 检查消息数量
    if (
      !request.messages ||
      request.messages.length < AI_LIMITS.minMessagesForSuggestion
    ) {
      return AI_ERROR_MESSAGES.NO_MESSAGES
    }

    return null
  }

  /**
   * 准备请求数据
   * userId 由 API 端从 session 获取，不在此处传递
   */
  private prepareRequestData(request: AISuggestionRequest): Record<string, unknown> {
    // 限制消息数量
    const messages = request.messages
      .slice(-AI_LIMITS.maxMessagesPerRequest)
      .map((msg) => ({
        ...msg,
        // 截断过长的消息内容
        content:
          msg.content.length > AI_LIMITS.maxMessageLength
            ? msg.content.slice(0, AI_LIMITS.maxMessageLength)
            : msg.content,
      }))

    // 限制建议数量
    const suggestionCount = Math.min(
      Math.max(request.suggestionCount || AI_CONFIG.suggestionCount, 1),
      3
    )

    return {
      messages,
      conversationId: request.conversationId,
      suggestionCount,
      suggestionTypes: request.suggestionTypes,
    }
  }

  /**
   * 调用 AI API
   */
  private async callAPI(
    requestData: Record<string, unknown>
  ): Promise<Response> {
    console.log('[AI Service] Calling API with data:', requestData)

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      AI_CONFIG.timeout
    )

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include', // 包含 cookies 以传递认证信息
        signal: controller.signal,
      })

      console.log('[AI Service] API response status:', response.status)
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 处理 API 响应
   */
  private async handleResponse(
    response: Response,
    startTime: number
  ): Promise<AISuggestionResponse> {
    if (!response.ok) {
      return this.handleErrorResponse(response, startTime)
    }

    try {
      const data = await response.json()

      // 验证并规范化建议数据
      const suggestions = this.normalizeSuggestions(data.suggestions || [])

      return {
        success: true,
        suggestions,
        provider: data.provider || AI_CONFIG.provider,
        model: data.model || AI_CONFIG.model,
        duration: Date.now() - startTime,
        tokenUsage: data.tokenUsage,
      }
    } catch {
      return {
        success: false,
        suggestions: [],
        error: AI_ERROR_MESSAGES.INVALID_RESPONSE,
        provider: AI_CONFIG.provider,
        model: AI_CONFIG.model,
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * 处理错误响应
   */
  private async handleErrorResponse(
    response: Response,
    startTime: number
  ): Promise<AISuggestionResponse> {
    let errorMessage = AI_ERROR_MESSAGES.API_ERROR

    try {
      const errorData = await response.json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        // 根据错误类型返回对应消息
        switch (errorData.error) {
          case 'DAILY_LIMIT_EXCEEDED':
            errorMessage = AI_ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED
            break
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = AI_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
            break
          default:
            errorMessage = errorData.message || AI_ERROR_MESSAGES.API_ERROR
        }
      }
    } catch {
      // 忽略 JSON 解析错误
    }

    return {
      success: false,
      suggestions: [],
      error: errorMessage,
      provider: AI_CONFIG.provider,
      model: AI_CONFIG.model,
      duration: Date.now() - startTime,
    }
  }

  /**
   * 处理异常错误
   */
  private handleError(
    error: Error,
    startTime: number
  ): AISuggestionResponse {
    let errorMessage = AI_ERROR_MESSAGES.UNKNOWN

    if (error.name === 'AbortError') {
      errorMessage = AI_ERROR_MESSAGES.TIMEOUT
    } else if (error.message.includes('Network')) {
      errorMessage = '网络错误，请检查网络连接'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      suggestions: [],
      error: errorMessage,
      provider: AI_CONFIG.provider,
      model: AI_CONFIG.model,
      duration: Date.now() - startTime,
    }
  }

  /**
   * 规范化建议数据
   */
  private normalizeSuggestions(
    suggestions: Partial<AISuggestion>[]
  ): AISuggestion[] {
    return suggestions
      .filter((s) => s.content)
      .map((s, index) => ({
        id: s.id || `sug-${index}`,
        content: s.content || '',
        type: s.type || 'reply',
        confidence: Math.min(Math.max(s.confidence || 0.5, 0), 1),
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      }))
  }

  /**
   * 检查使用限制
   */
  async checkUsageLimit(
    userId: string
  ): Promise<{ exceeded: boolean; remaining: number; todayUsage?: number; totalUsage?: number }> {
    try {
      const response = await fetch('/api/ai/suggestions', {
        credentials: 'include', // 包含 cookies 以传递认证信息
      })
      if (response.ok) {
        const data = await response.json()
        return {
          exceeded: data.usageStats?.remainingUsage === 0,
          remaining: data.usageStats?.remainingUsage ?? AI_CONFIG.dailyLimit,
          todayUsage: data.usageStats?.todayUsage,
          totalUsage: data.usageStats?.totalUsage,
        }
      }
    } catch {
      // 忽略错误，返回默认值
    }

    return {
      exceeded: false,
      remaining: AI_CONFIG.dailyLimit,
    }
  }

  /**
   * 增加使用次数
   */
  async incrementUsage(userId: string): Promise<void> {
    // 使用次数由 API 端点自动处理
    // 此方法保留用于扩展
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(userId: string): Promise<{
    userId: string
    todayUsage: number
    remainingUsage: number
    totalUsage: number
    lastUsedAt: Date | null
  } | null> {
    try {
      const response = await fetch('/api/ai/config', {
        credentials: 'include', // 包含 cookies 以传递认证信息
      })
      if (response.ok) {
        const data = await response.json()
        return data.usageStats
      }
    } catch {
      // 忽略错误
    }
    return null
  }
}

// 导出单例实例
export const aiService = new AIService()
