/**
 * useAISuggestion Hook
 *
 * 提供 AI 建议功能的状态管理和操作方法
 * 用户认证由 API 端通过 session 自动处理
 *
 * 注意：隐私确认逻辑已移至 ChatArea 组件，每次使用都需要用户确认
 */

import { useCallback, useState } from 'react'

import { aiService } from '@/services/ai/ai-service'
import type {
  AISuggestion,
  AISuggestionRequest,
  AIUsageStats,
} from '@/types/ai'

/**
 * AI 建议 Hook 返回类型
 */
interface UseAISuggestionReturn {
  // 状态
  suggestions: AISuggestion[]
  isLoading: boolean
  error: string | null
  usageStats: AIUsageStats | null
  selectedSuggestion: AISuggestion | null

  // 方法
  fetchSuggestions: (request: Omit<AISuggestionRequest, 'userId'>) => Promise<void>
  selectSuggestion: (suggestion: AISuggestion) => void
  clearSelection: () => void
  clearError: () => void
  retry: () => Promise<void>
  submitFeedback: (suggestionId: string, feedbackType: 'positive' | 'negative') => Promise<void>
}

/**
 * AI 建议 Hook
 */
export function useAISuggestion(): UseAISuggestionReturn {
  // 状态定义
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null)
  const [lastRequest, setLastRequest] = useState<Omit<AISuggestionRequest, 'userId'> | null>(null)

  /**
   * 获取 AI 建议
   * 用户 ID 由 API 端通过 session 自动获取
   * 注意：隐私确认由 ChatArea 组件处理，此处不再检查
   */
  const fetchSuggestions = useCallback(
    async (request: Omit<AISuggestionRequest, 'userId'>) => {
      console.log('[AI] fetchSuggestions called:', {
        messagesCount: request.messages?.length,
        messages: request.messages
      })

      // 验证消息数量
      if (!request.messages || request.messages.length < 2) {
        console.log('[AI] Messages count insufficient:', request.messages?.length)
        setError('消息数量不足，无法生成建议（需要至少 2 条消息）')
        return
      }

      setIsLoading(true)
      setError(null)
      setLastRequest(request)

      try {
        console.log('[AI] Calling aiService.generateSuggestions...')
        const response = await aiService.generateSuggestions(request)

        console.log('[AI] Response:', response)

        if (response.success) {
          console.log('[AI] Success, suggestions:', response.suggestions)
          setSuggestions(response.suggestions)
          // 更新使用统计
          if (response.tokenUsage) {
            setUsageStats((prev) => ({
              userId: 'current-user',
              todayUsage: (prev?.todayUsage || 0) + 1,
              remainingUsage: Math.max((prev?.remainingUsage || 20) - 1, 0),
              totalUsage: (prev?.totalUsage || 0) + 1,
              lastUsedAt: new Date(),
            }))
          }
        } else {
          setError(response.error || '获取建议失败')
          setSuggestions([])
        }
      } catch {
        setError('网络错误，请稍后重试')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 选择建议
   */
  const selectSuggestion = useCallback((suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion)
  }, [])

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setSelectedSuggestion(null)
  }, [])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 重试
   */
  const retry = useCallback(async () => {
    if (lastRequest) {
      await fetchSuggestions(lastRequest)
    }
  }, [lastRequest, fetchSuggestions])

  /**
   * 提交反馈
   */
  const submitFeedback = useCallback(
    async (suggestionId: string, feedbackType: 'positive' | 'negative') => {
      try {
        const suggestion = suggestions.find((s) => s.id === suggestionId)
        await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            suggestionId,
            feedbackType,
            suggestionContent: suggestion?.content,
          }),
        })
      } catch {
        // 忽略反馈错误
      }
    },
    [suggestions]
  )

  return {
    suggestions,
    isLoading,
    error,
    usageStats,
    selectedSuggestion,
    fetchSuggestions,
    selectSuggestion,
    clearSelection,
    clearError,
    retry,
    submitFeedback,
  }
}
