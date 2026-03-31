/**
 * useAISuggestion Hook 测试
 *
 * 测试覆盖：
 * - Hook 状态管理
 * - AI 建议获取流程
 * - 错误处理
 * - 频率限制处理
 * - 隐私声明处理
 */

import { act, renderHook, waitFor } from '@testing-library/react'

import type { AISuggestion, AIUsageStats } from '@/types/ai'

import { useAISuggestion } from '../useAISuggestion'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock AI 服务
jest.mock('@/services/ai/ai-service', () => ({
  aiService: {
    generateSuggestions: jest.fn(),
    getUsageStats: jest.fn(),
  },
  AIService: jest.fn().mockImplementation(() => ({
    generateSuggestions: jest.fn(),
    getUsageStats: jest.fn(),
  })),
}))

describe('useAISuggestion Hook 测试', () => {
  // 测试用的建议数据
  const mockSuggestions: AISuggestion[] = [
    { id: 'sug-1', content: '建议回复 1', type: 'reply', confidence: 0.9, createdAt: new Date() },
    { id: 'sug-2', content: '建议回复 2', type: 'question', confidence: 0.85, createdAt: new Date() },
  ]

  // 测试用的使用统计
  const mockUsageStats: AIUsageStats = {
    userId: 'test-user-id',
    todayUsage: 5,
    remainingUsage: 15,
    totalUsage: 100,
    lastUsedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // 清空 localStorage
    localStorage.clear()
  })

  // ==================== 初始状态测试 ====================

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useAISuggestion())

      expect(result.current.suggestions).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.usageStats).toBeNull()
    })

    it('首次使用时应该显示隐私声明', () => {
      // localStorage 中没有隐私声明同意记录
      const { result } = renderHook(() => useAISuggestion())

      expect(result.current.hasAcceptedPrivacy).toBe(false)
    })

    it('已同意隐私声明后不应该再显示', () => {
      // 设置已同意隐私声明
      localStorage.setItem('ai-privacy-accepted', 'true')

      const { result } = renderHook(() => useAISuggestion())

      expect(result.current.hasAcceptedPrivacy).toBe(true)
    })
  })

  // ==================== 获取建议测试 ====================

  describe('获取 AI 建议', () => {
    it('成功获取建议', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: mockSuggestions,
          usageStats: mockUsageStats,
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      // 先同意隐私声明
      act(() => {
        result.current.acceptPrivacy()
      })

      // 获取建议
      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2)
        expect(result.current.suggestions[0].content).toBe('建议回复 1')
      })
    })

    it('获取建议时应该设置 loading 状态', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      // 开始获取建议
      act(() => {
        result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      // 此时应该是 loading 状态
      expect(result.current.isLoading).toBe(true)

      // 完成请求
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            suggestions: mockSuggestions,
            usageStats: mockUsageStats,
          }),
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('获取建议失败时应该设置错误状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'API_ERROR',
          message: 'AI 服务暂时不可用',
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.suggestions).toHaveLength(0)
      })
    })

    it('未同意隐私声明时不应该获取建议', async () => {
      const { result } = renderHook(() => useAISuggestion())

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
          ],
          userId: 'test-user-id',
        })
      })

      // 不应该调用 API
      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.error).toContain('隐私')
    })
  })

  // ==================== 频率限制测试 ====================

  describe('使用频率限制', () => {
    it('达到每日限制时应该返回错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'DAILY_LIMIT_EXCEEDED',
          message: '今日使用次数已达上限',
          usageStats: { ...mockUsageStats, remainingUsage: 0 },
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.error).toContain('上限')
        expect(result.current.usageStats?.remainingUsage).toBe(0)
      })
    })

    it('应该更新使用统计', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: mockSuggestions,
          usageStats: mockUsageStats,
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.usageStats).not.toBeNull()
        expect(result.current.usageStats?.todayUsage).toBe(5)
        expect(result.current.usageStats?.remainingUsage).toBe(15)
      })
    })
  })

  // ==================== 隐私声明测试 ====================

  describe('隐私声明处理', () => {
    it('同意隐私声明应该更新状态', () => {
      const { result } = renderHook(() => useAISuggestion())

      expect(result.current.hasAcceptedPrivacy).toBe(false)

      act(() => {
        result.current.acceptPrivacy()
      })

      expect(result.current.hasAcceptedPrivacy).toBe(true)
      expect(localStorage.getItem('ai-privacy-accepted')).toBe('true')
    })

    it('重置隐私声明同意状态', () => {
      localStorage.setItem('ai-privacy-accepted', 'true')

      const { result } = renderHook(() => useAISuggestion())

      expect(result.current.hasAcceptedPrivacy).toBe(true)

      act(() => {
        result.current.resetPrivacy()
      })

      expect(result.current.hasAcceptedPrivacy).toBe(false)
      expect(localStorage.getItem('ai-privacy-accepted')).toBeNull()
    })
  })

  // ==================== 建议选择测试 ====================

  describe('建议选择', () => {
    it('选择建议应该更新选中状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: mockSuggestions,
          usageStats: mockUsageStats,
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2)
      })

      // 选择第一个建议
      act(() => {
        result.current.selectSuggestion(mockSuggestions[0])
      })

      expect(result.current.selectedSuggestion).toEqual(mockSuggestions[0])
    })

    it('清除选择应该重置选中状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: mockSuggestions,
          usageStats: mockUsageStats,
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2)
      })

      act(() => {
        result.current.selectSuggestion(mockSuggestions[0])
      })

      expect(result.current.selectedSuggestion).not.toBeNull()

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedSuggestion).toBeNull()
    })
  })

  // ==================== 错误重置测试 ====================

  describe('错误重置', () => {
    it('清除错误应该重置错误状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'API_ERROR',
          message: 'AI 服务暂时不可用',
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  // ==================== 重试机制测试 ====================

  describe('重试机制', () => {
    it('重试应该重新获取建议', async () => {
      // 第一次失败
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'API_ERROR',
          message: 'AI 服务暂时不可用',
        }),
      })

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // 第二次成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          suggestions: mockSuggestions,
          usageStats: mockUsageStats,
        }),
      })

      await act(async () => {
        await result.current.retry()
      })

      await waitFor(() => {
        expect(result.current.suggestions).toHaveLength(2)
        expect(result.current.error).toBeNull()
      })
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况', () => {
    it('消息为空时不应该调用 API', async () => {
      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [],
          userId: 'test-user-id',
        })
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.error).toContain('不足')
    })

    it('用户 ID 为空时不应该调用 API', async () => {
      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
          ],
          userId: '',
        })
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('网络错误时应该返回友好错误信息', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAISuggestion())

      act(() => {
        result.current.acceptPrivacy()
      })

      await act(async () => {
        await result.current.fetchSuggestions({
          messages: [
            { senderId: '1', content: '你好', timestamp: new Date(), isCurrentUser: false },
            { senderId: '2', content: '你好啊', timestamp: new Date(), isCurrentUser: true },
          ],
          userId: 'test-user-id',
        })
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })
  })
})
