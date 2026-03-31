/**
 * AI 服务单元测试
 *
 * 测试覆盖：
 * - AI 建议生成成功场景
 * - API 调用失败场景
 * - 频率限制场景
 * - 边界情况处理
 */

import type { AISuggestionRequest, AISuggestionResponse } from '@/types/ai'

import { AIService } from '../ai-service'

// Mock fetch 函数
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock AI 配置
jest.mock('@/lib/ai/config', () => ({
  AI_CONFIG: {
    provider: 'alibaba',
    model: 'qwen-flash',
    apiKey: 'test-api-key',
    suggestionCount: 3,
    dailyLimit: 20,
    timeout: 10000,
    maxRetries: 2,
  },
  AI_LIMITS: {
    maxMessagesPerRequest: 20,
    maxMessageLength: 500,
    minMessagesForSuggestion: 2,
    maxSuggestionLength: 100,
    cacheTTL: 5 * 60 * 1000,
  },
  AI_ERROR_MESSAGES: {
    RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
    DAILY_LIMIT_EXCEEDED: '今日使用次数已达上限，请明天再来',
    TIMEOUT: 'AI 服务响应超时，请稍后重试',
    API_ERROR: 'AI 服务暂时不可用，请稍后重试',
    INVALID_RESPONSE: 'AI 返回了无效的响应',
    PROVIDER_UNAVAILABLE: 'AI 提供商服务不可用',
    NO_MESSAGES: '消息数量不足，无法生成建议',
    UNKNOWN: '发生未知错误，请稍后重试',
  },
  isAIConfigValid: () => true,
}))

describe('AI 服务测试', () => {
  let aiService: AIService

  // 测试用的消息上下文
  const mockMessages = [
    {
      senderId: 'user-1',
      senderName: 'Alice',
      content: '你好，最近怎么样？',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      isCurrentUser: false,
    },
    {
      senderId: 'user-2',
      senderName: 'Bob',
      content: '挺好的，你呢？',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      isCurrentUser: true,
    },
  ]

  // 成功的 AI 响应
  const mockSuccessResponse: AISuggestionResponse = {
    success: true,
    suggestions: [
      { id: 'sug-1', content: '我最近也很不错', type: 'reply', confidence: 0.9, createdAt: new Date() },
      { id: 'sug-2', content: '周末有什么计划？', type: 'question', confidence: 0.85, createdAt: new Date() },
      { id: 'sug-3', content: '最近在忙什么？', type: 'topic', confidence: 0.8, createdAt: new Date() },
    ],
    provider: 'alibaba',
    model: 'qwen-flash',
    duration: 500,
    tokenUsage: { prompt: 100, completion: 50, total: 150 },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    aiService = new AIService()
  })

  // ==================== 成功场景测试 ====================

  describe('成功生成建议', () => {
    it('应该成功生成 1-3 个建议', async () => {
      // 模拟成功的 API 响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(true)
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions.length).toBeLessThanOrEqual(3)
      expect(result.suggestions[0]).toHaveProperty('content')
      expect(result.suggestions[0]).toHaveProperty('type')
      expect(result.suggestions[0]).toHaveProperty('confidence')
    })

    it('应该正确传递上下文消息给 AI API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
        conversationId: 'conv-123',
      }

      await aiService.generateSuggestions(request)

      // 验证 fetch 被调用，且参数正确
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[0]).toContain('/api/ai/suggestions')
    })

    it('应该返回正确的提供商和模型信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.provider).toBe('alibaba')
      expect(result.model).toBe('qwen-flash')
    })

    it('应该返回 Token 使用量信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.tokenUsage).toBeDefined()
      expect(result.tokenUsage?.total).toBe(150)
    })
  })

  // ==================== 失败场景测试 ====================

  describe('API 调用失败场景', () => {
    it('网络错误时应该返回友好错误信息', async () => {
      // 模拟网络错误
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('网络')
    })

    it('API 返回 500 错误时应该返回友好错误信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('API 返回无效 JSON 时应该处理错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('无效')
    })

    it('请求超时应该返回超时错误', async () => {
      // 模拟超时（AbortError）
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('超时')
    })
  })

  // ==================== 频率限制测试 ====================

  describe('使用频率限制', () => {
    it('达到每日限制时应该返回限制错误', async () => {
      // 模拟 API 返回限制错误
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'DAILY_LIMIT_EXCEEDED',
          message: '今日使用次数已达上限',
        }),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('上限')
    })

    it('请求过于频繁时应该返回频率限制错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁',
        }),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('频繁')
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况处理', () => {
    it('消息数量不足时应该返回错误', async () => {
      const request: AISuggestionRequest = {
        messages: [mockMessages[0]], // 只有一条消息
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不足')
    })

    it('空消息列表应该返回错误', async () => {
      const request: AISuggestionRequest = {
        messages: [],
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不足')
    })

    it('消息内容过长时应该截断', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const longMessage = {
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'A'.repeat(1000), // 超过最大长度
        timestamp: new Date(),
        isCurrentUser: false,
      }

      const request: AISuggestionRequest = {
        messages: [longMessage, mockMessages[1]],
        userId: 'test-user-id',
      }

      // 应该不会抛出错误，而是正常处理
      const result = await aiService.generateSuggestions(request)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('用户 ID 为空时应该处理', async () => {
      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: '',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
    })

    it('建议数量参数应该在有效范围内', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
        suggestionCount: 5, // 超过最大值 3
      }

      await aiService.generateSuggestions(request)

      // 验证建议数量被限制在 1-3 范围内
      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArgs.suggestionCount).toBeLessThanOrEqual(3)
    })
  })

  // ==================== 重试机制测试 ====================

  describe('重试机制', () => {
    it('首次失败后应该重试', async () => {
      // 第一次失败，第二次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessResponse),
        })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('达到最大重试次数后应该返回错误', async () => {
      // 所有尝试都失败
      mockFetch.mockRejectedValue(new Error('Network error'))

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(false)
      // 初始调用 + 2 次重试 = 3 次
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  // ==================== 响应格式验证测试 ====================

  describe('响应格式验证', () => {
    it('API 返回空建议列表时应该处理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: [],
          provider: 'alibaba',
          model: 'qwen-flash',
          duration: 100,
        }),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      expect(result.success).toBe(true)
      expect(result.suggestions).toHaveLength(0)
    })

    it('建议缺少必要字段时应该处理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: [
            { id: 'sug-1' }, // 缺少 content 和 type
          ],
          provider: 'alibaba',
          model: 'qwen-flash',
          duration: 100,
        }),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      // 应该过滤掉无效建议或返回错误
      expect(result.success).toBe(true)
    })

    it('置信度应该在有效范围内', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: [
            { id: 'sug-1', content: '测试', type: 'reply', confidence: 1.5, createdAt: new Date() },
          ],
          provider: 'alibaba',
          model: 'qwen-flash',
          duration: 100,
        }),
      })

      const request: AISuggestionRequest = {
        messages: mockMessages,
        userId: 'test-user-id',
      }

      const result = await aiService.generateSuggestions(request)

      // 置信度应该被限制在 0-1 范围内
      if (result.suggestions.length > 0) {
        expect(result.suggestions[0].confidence).toBeLessThanOrEqual(1)
        expect(result.suggestions[0].confidence).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
