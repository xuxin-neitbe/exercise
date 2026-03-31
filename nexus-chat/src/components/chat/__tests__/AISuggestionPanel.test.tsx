/**
 * AI 建议面板组件测试
 *
 * 测试覆盖：
 * - 面板渲染
 * - 建议列表显示
 * - 建议选择
 * - 反馈功能
 * - 关闭面板
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { AISuggestion } from '@/types/ai'

import { AISuggestionPanel } from '../AISuggestionPanel'

// Mock useAISuggestion hook
const mockSelectSuggestion = jest.fn()
const mockSubmitFeedback = jest.fn()
const mockClosePanel = jest.fn()

jest.mock('@/hooks/useAISuggestion', () => ({
  useAISuggestion: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    selectedSuggestion: null,
    selectSuggestion: mockSelectSuggestion,
    submitFeedback: mockSubmitFeedback,
  })),
}))

describe('AISuggestionPanel 组件测试', () => {
  // 测试用的建议数据
  const mockSuggestions: AISuggestion[] = [
    { id: 'sug-1', content: '建议回复 1：我最近也很不错', type: 'reply', confidence: 0.9, createdAt: new Date() },
    { id: 'sug-2', content: '建议回复 2：周末有什么计划？', type: 'question', confidence: 0.85, createdAt: new Date() },
    { id: 'sug-3', content: '建议回复 3：最近在忙什么？', type: 'topic', confidence: 0.8, createdAt: new Date() },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: mockClosePanel,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==================== 渲染测试 ====================

  describe('渲染测试', () => {
    it('面板打开时应该显示', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('面板关闭时不应该显示', () => {
      render(<AISuggestionPanel isOpen={false} onClose={mockClosePanel} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('应该显示面板标题', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText(/AI 建议回复/i)).toBeInTheDocument()
    })

    it('应该显示关闭按钮', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument()
    })
  })

  // ==================== 建议列表测试 ====================

  describe('建议列表', () => {
    it('有建议时应该显示建议列表', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText('建议回复 1：我最近也很不错')).toBeInTheDocument()
      expect(screen.getByText('建议回复 2：周末有什么计划？')).toBeInTheDocument()
      expect(screen.getByText('建议回复 3：最近在忙什么？')).toBeInTheDocument()
    })

    it('没有建议时应该显示空状态', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText(/暂无建议/i)).toBeInTheDocument()
    })

    it('应该显示建议类型标签', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText('回复')).toBeInTheDocument()
      expect(screen.getByText('问题')).toBeInTheDocument()
      expect(screen.getByText('话题')).toBeInTheDocument()
    })

    it('应该显示置信度', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      // 置信度以百分比显示
      expect(screen.getByText(/90%/)).toBeInTheDocument()
    })
  })

  // ==================== 建议选择测试 ====================

  describe('建议选择', () => {
    it('点击建议应该触发选择', async () => {
      const user = userEvent.setup()
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      await user.click(screen.getByText('建议回复 1：我最近也很不错'))

      expect(mockSelectSuggestion).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('选中的建议应该有高亮样式', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: mockSuggestions[0],
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const selectedCard = screen.getByText('建议回复 1：我最近也很不错').closest('div')
      expect(selectedCard).toHaveClass('selected')
    })

    it('选择建议后应该显示确认按钮', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: mockSuggestions[0],
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /使用此建议/i })).toBeInTheDocument()
    })
  })

  // ==================== 反馈功能测试 ====================

  describe('反馈功能', () => {
    it('每个建议应该有点赞按钮', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const likeButtons = screen.getAllByRole('button', { name: /点赞/i })
      expect(likeButtons).toHaveLength(3)
    })

    it('每个建议应该有点踩按钮', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const dislikeButtons = screen.getAllByRole('button', { name: /点踩/i })
      expect(dislikeButtons).toHaveLength(3)
    })

    it('点击点赞应该提交正面反馈', async () => {
      const user = userEvent.setup()
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const likeButtons = screen.getAllByRole('button', { name: /点赞/i })
      await user.click(likeButtons[0])

      expect(mockSubmitFeedback).toHaveBeenCalledWith('sug-1', 'positive')
    })

    it('点击点踩应该提交负面反馈', async () => {
      const user = userEvent.setup()
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const dislikeButtons = screen.getAllByRole('button', { name: /点踩/i })
      await user.click(dislikeButtons[0])

      expect(mockSubmitFeedback).toHaveBeenCalledWith('sug-1', 'negative')
    })

    it('提交反馈后应该显示感谢提示', async () => {
      const user = userEvent.setup()
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const likeButtons = screen.getAllByRole('button', { name: /点赞/i })
      await user.click(likeButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/感谢反馈/i)).toBeInTheDocument()
      })
    })
  })

  // ==================== 加载状态测试 ====================

  describe('加载状态', () => {
    it('加载中应该显示加载动画', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [],
        isLoading: true,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText(/正在生成建议/i)).toBeInTheDocument()
    })

    it('加载中应该显示骨架屏', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [],
        isLoading: true,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      // 检查骨架屏元素
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  // ==================== 错误状态测试 ====================

  describe('错误状态', () => {
    it('有错误时应该显示错误信息', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [],
        isLoading: false,
        error: 'AI 服务暂时不可用',
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText(/AI 服务暂时不可用/i)).toBeInTheDocument()
    })

    it('错误状态应该显示重试按钮', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [],
        isLoading: false,
        error: 'AI 服务暂时不可用',
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument()
    })
  })

  // ==================== 关闭面板测试 ====================

  describe('关闭面板', () => {
    it('点击关闭按钮应该关闭面板', async () => {
      const user = userEvent.setup()
      render(<AISuggestionPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /关闭/i }))

      expect(mockClosePanel).toHaveBeenCalled()
    })

    it('点击遮罩层应该关闭面板', async () => {
      const user = userEvent.setup()
      render(<AISuggestionPanel {...defaultProps} />)

      // 点击遮罩层（面板外部）
      const overlay = screen.getByRole('dialog').parentElement
      if (overlay) {
        await user.click(overlay)
        expect(mockClosePanel).toHaveBeenCalled()
      }
    })

    it('按 ESC 键应该关闭面板', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockClosePanel).toHaveBeenCalled()
    })
  })

  // ==================== 可访问性测试 ====================

  describe('可访问性', () => {
    it('面板应该有正确的 aria 属性', () => {
      render(<AISuggestionPanel {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('建议列表应该有正确的角色', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('每个建议应该有正确的角色', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况', () => {
    it('建议内容过长时应该截断显示', () => {
      const longSuggestion: AISuggestion = {
        id: 'sug-long',
        content: 'A'.repeat(200),
        type: 'reply',
        confidence: 0.9,
        createdAt: new Date(),
      }

      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [longSuggestion],
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      // 内容应该被截断
      const suggestionText = screen.getByText(/A{100}/)
      expect(suggestionText).toBeInTheDocument()
    })

    it('置信度为 0 时应该正常显示', () => {
      const zeroConfidenceSuggestion: AISuggestion = {
        id: 'sug-zero',
        content: '测试建议',
        type: 'reply',
        confidence: 0,
        createdAt: new Date(),
      }

      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        suggestions: [zeroConfidenceSuggestion],
        isLoading: false,
        error: null,
        selectedSuggestion: null,
        selectSuggestion: mockSelectSuggestion,
        submitFeedback: mockSubmitFeedback,
      })

      render(<AISuggestionPanel {...defaultProps} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})
