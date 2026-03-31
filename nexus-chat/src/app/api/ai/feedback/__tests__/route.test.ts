/**
 * AI 反馈 API 测试
 *
 * 测试覆盖：
 * - 用户点赞/点踩反馈
 * - 反馈记录存储
 * - 错误处理
 */

import { POST } from '../route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', name: 'Test User' },
  })),
}))

// 创建模拟请求
function createRequest(body: unknown) {
  return {
    json: async () => body,
  } as unknown as Request
}

describe('AI 反馈 API 测试', () => {
  // 测试用的有效请求体
  const validFeedbackBody = {
    suggestionId: 'sug-123',
    feedbackType: 'positive' as const,
    suggestionContent: '这是一个建议回复',
    conversationId: 'conv-456',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // 重置 Prisma mock
    const { prisma } = require('@/lib/prisma')
    prisma.aISuggestionFeedback.findUnique.mockResolvedValue(null)
    prisma.aISuggestionFeedback.create.mockResolvedValue({
      id: 'feedback-1',
      ...validFeedbackBody,
      userId: 'test-user-id',
      createdAt: new Date(),
    })
    prisma.aISuggestionFeedback.update.mockResolvedValue({
      id: 'feedback-1',
      ...validFeedbackBody,
      userId: 'test-user-id',
    })
  })

  // ==================== 成功场景测试 ====================

  describe('POST /api/ai/feedback - 成功场景', () => {
    it('成功提交点赞反馈应该返回 200', async () => {
      const request = createRequest(validFeedbackBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('感谢')
    })

    it('成功提交点踩反馈应该返回 200', async () => {
      const request = createRequest({
        ...validFeedbackBody,
        feedbackType: 'negative',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('反馈应该关联正确的用户 ID', async () => {
      const { prisma } = require('@/lib/prisma')
      const request = createRequest(validFeedbackBody)
      await POST(request)

      // 验证 create 被调用时传入了正确的 userId
      expect(prisma.aISuggestionFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'test-user-id',
          }),
        })
      )
    })

    it('反馈应该包含建议内容', async () => {
      const { prisma } = require('@/lib/prisma')
      const request = createRequest(validFeedbackBody)
      await POST(request)

      expect(prisma.aISuggestionFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            suggestionContent: validFeedbackBody.suggestionContent,
          }),
        })
      )
    })
  })

  // ==================== 错误场景测试 ====================

  describe('POST /api/ai/feedback - 错误场景', () => {
    it('未登录应该返回 401', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValueOnce(null)

      const request = createRequest(validFeedbackBody)
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('缺少建议 ID 应该返回 400', async () => {
      const request = createRequest({
        feedbackType: 'positive',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('建议')
    })

    it('缺少反馈类型应该返回 400', async () => {
      const request = createRequest({
        suggestionId: 'sug-123',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('反馈类型')
    })

    it('无效的反馈类型应该返回 400', async () => {
      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'invalid',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('反馈类型')
    })

    it('数据库错误应该返回 500', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.aISuggestionFeedback.create.mockRejectedValue(new Error('Database error'))

      const request = createRequest(validFeedbackBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况', () => {
    it('建议内容为空时应该允许提交', async () => {
      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'positive',
        suggestionContent: '',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('建议内容包含特殊字符时应该正常处理', async () => {
      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'positive',
        suggestionContent: '特殊字符 <script>alert(1)</script> & "引号"',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('建议 ID 包含特殊字符时应该正常处理', async () => {
      const request = createRequest({
        suggestionId: 'sug-123-abc_XYZ',
        feedbackType: 'positive',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('建议内容过长时应该正常处理', async () => {
      const longContent = 'A'.repeat(500)
      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'positive',
        suggestionContent: longContent,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ==================== 重复反馈测试 ====================

  describe('重复反馈处理', () => {
    it('同一用户对同一建议重复反馈应该更新记录', async () => {
      const { prisma } = require('@/lib/prisma')
      // 先查找已存在的记录
      prisma.aISuggestionFeedback.findUnique.mockResolvedValue({
        id: 'existing-feedback',
        suggestionId: 'sug-123',
        feedbackType: 'positive',
        userId: 'test-user-id',
      })
      // 更新记录
      prisma.aISuggestionFeedback.update.mockResolvedValue({
        id: 'existing-feedback',
        suggestionId: 'sug-123',
        feedbackType: 'negative',
        userId: 'test-user-id',
      })

      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'negative',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      // 应该调用 update 而不是 create
      expect(prisma.aISuggestionFeedback.update).toHaveBeenCalled()
    })
  })

  // ==================== 可选字段测试 ====================

  describe('可选字段', () => {
    it('不提供 conversationId 时应该正常处理', async () => {
      const request = createRequest({
        suggestionId: 'sug-123',
        feedbackType: 'positive',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
