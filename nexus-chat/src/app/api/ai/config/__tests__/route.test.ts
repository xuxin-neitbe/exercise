/**
 * AI 配置 API 测试
 *
 * 测试覆盖：
 * - 获取 AI 配置信息
 * - 使用统计查询
 * - 错误处理
 */

import { GET } from '../route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', name: 'Test User' },
  })),
}))

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
  AI_PROVIDER_CONFIG: {
    alibaba: {
      name: '阿里云通义千问',
      defaultModel: 'qwen-flash',
      models: ['qwen-flash', 'qwen-turbo', 'qwen-plus', 'qwen-max'],
    },
  },
  AI_LIMITS: {
    maxMessagesPerRequest: 20,
    maxMessageLength: 500,
    minMessagesForSuggestion: 2,
    maxSuggestionLength: 100,
    cacheTTL: 5 * 60 * 1000,
  },
  isAIConfigValid: () => true,
}))

describe('AI 配置 API 测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    // 重置 Prisma mock
    const { prisma } = require('@/lib/prisma')
    prisma.aISuggestionUsage.findUnique.mockResolvedValue({ count: 5 })
    prisma.aISuggestionUsage.aggregate.mockResolvedValue({ _sum: { count: 100 } })
    prisma.aISuggestionUsage.findFirst.mockResolvedValue({ updatedAt: new Date() })

    // 重置 session mock
    const { getServerSession } = require('next-auth')
    getServerSession.mockResolvedValue({
      user: { id: 'test-user-id', name: 'Test User' },
    })
  })

  // ==================== 成功场景测试 ====================

  describe('GET /api/ai/config - 成功场景', () => {
    it('应该返回 AI 配置信息', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config).toBeDefined()
      expect(data.config.provider).toBe('alibaba')
      expect(data.config.model).toBe('qwen-flash')
    })

    it('应该返回每日限制信息', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config.dailyLimit).toBe(20)
    })

    it('应该返回使用统计', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.usageStats).toBeDefined()
    })

    it('应该返回提供商信息', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.provider).toBeDefined()
      expect(data.provider.name).toBe('阿里云通义千问')
    })

    it('应该返回限制配置', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.limits).toBeDefined()
      expect(data.limits.maxMessagesPerRequest).toBe(20)
      expect(data.limits.minMessagesForSuggestion).toBe(2)
    })

    it('配置有效时应该返回 isValid: true', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(true)
    })
  })

  // ==================== 认证测试 ====================

  describe('认证测试', () => {
    it('未登录应该返回 401', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValueOnce(null)

      const response = await GET({} as Request)

      expect(response.status).toBe(401)
    })

    it('已登录用户应该能获取配置', async () => {
      const response = await GET({} as Request)

      expect(response.status).toBe(200)
    })
  })

  // ==================== 错误场景测试 ====================

  describe('错误场景', () => {
    it('获取使用统计失败时应该返回部分数据', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.aISuggestionUsage.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await GET({} as Request)
      const data = await response.json()

      // 应该仍然返回配置，但使用统计为 null
      expect(response.status).toBe(200)
      expect(data.config).toBeDefined()
      expect(data.usageStats).toBeNull()
    })

    it('配置无效时应该返回 isValid: false', async () => {
      const { isAIConfigValid } = require('@/lib/ai/config')
      isAIConfigValid.mockReturnValueOnce(false)

      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isValid).toBe(false)
    })
  })

  // ==================== 敏感信息测试 ====================

  describe('敏感信息保护', () => {
    it('不应该返回 API Key', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config.apiKey).toBeUndefined()
    })

    it('返回的配置不应该包含敏感字段', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      // 验证敏感字段不存在
      const configString = JSON.stringify(data)
      expect(configString).not.toContain('apiKey')
      expect(configString).not.toContain('test-api-key')
    })
  })

  // ==================== 使用统计边界情况测试 ====================

  describe('使用统计边界情况', () => {
    it('首次使用时使用统计应该为零', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.aISuggestionUsage.findUnique.mockResolvedValue(null)
      prisma.aISuggestionUsage.aggregate.mockResolvedValue({ _sum: { count: null } })
      prisma.aISuggestionUsage.findFirst.mockResolvedValue(null)

      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.usageStats.todayUsage).toBe(0)
      expect(data.usageStats.remainingUsage).toBe(20)
      expect(data.usageStats.lastUsedAt).toBeNull()
    })

    it('达到每日限制时剩余次数应该为零', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.aISuggestionUsage.findUnique.mockResolvedValue({ count: 20 })
      prisma.aISuggestionUsage.aggregate.mockResolvedValue({ _sum: { count: 100 } })
      prisma.aISuggestionUsage.findFirst.mockResolvedValue({ updatedAt: new Date() })

      const response = await GET({} as Request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.usageStats.remainingUsage).toBe(0)
    })
  })

  // ==================== 响应格式测试 ====================

  describe('响应格式', () => {
    it('响应应该包含所有必要字段', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      // 验证响应结构
      expect(data).toHaveProperty('config')
      expect(data).toHaveProperty('provider')
      expect(data).toHaveProperty('limits')
      expect(data).toHaveProperty('isValid')
      expect(data).toHaveProperty('usageStats')
    })

    it('配置对象应该包含正确的字段', async () => {
      const response = await GET({} as Request)
      const data = await response.json()

      expect(data.config).toHaveProperty('provider')
      expect(data.config).toHaveProperty('model')
      expect(data.config).toHaveProperty('suggestionCount')
      expect(data.config).toHaveProperty('dailyLimit')
    })
  })
})
