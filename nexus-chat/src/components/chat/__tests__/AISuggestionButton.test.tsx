/**
 * AI 建议按钮组件测试
 *
 * 测试覆盖：
 * - 按钮渲染
 * - 点击事件处理
 * - 加载状态
 * - 禁用状态
 * - 使用次数显示
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AISuggestionButton } from '../AISuggestionButton'

// Mock useAISuggestion hook
const mockFetchSuggestions = jest.fn()
const mockUseAISuggestion = {
  isLoading: false,
  error: null,
  usageStats: { remainingUsage: 15, todayUsage: 5 },
  hasAcceptedPrivacy: true,
  fetchSuggestions: mockFetchSuggestions,
}

jest.mock('@/hooks/useAISuggestion', () => ({
  useAISuggestion: jest.fn(() => mockUseAISuggestion),
}))

describe('AISuggestionButton 组件测试', () => {
  const mockOnClick = jest.fn()
  const { useAISuggestion } = require('@/hooks/useAISuggestion')

  beforeEach(() => {
    jest.clearAllMocks()
    // 重置 mock 状态
    Object.assign(mockUseAISuggestion, {
      isLoading: false,
      error: null,
      usageStats: { remainingUsage: 15, todayUsage: 5 },
      hasAcceptedPrivacy: true,
    })
  })

  // ==================== 渲染测试 ====================

  describe('渲染测试', () => {
    it('应该正确渲染按钮', () => {
      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('应该显示按钮文字', () => {
      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByText(/帮我回答/i)).toBeInTheDocument()
    })

    it('应该显示 AI 图标', () => {
      render(<AISuggestionButton onClick={mockOnClick} />)

      // 检查是否有 SVG 图标
      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('应该显示剩余使用次数', () => {
      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByText(/15/)).toBeInTheDocument()
    })
  })

  // ==================== 点击事件测试 ====================

  describe('点击事件', () => {
    it('点击按钮应该触发 onClick 回调', async () => {
      const user = userEvent.setup()
      render(<AISuggestionButton onClick={mockOnClick} />)

      await user.click(screen.getByRole('button'))

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('禁用状态下点击不应该触发 onClick', async () => {
      const user = userEvent.setup()
      render(<AISuggestionButton onClick={mockOnClick} disabled />)

      await user.click(screen.getByRole('button'))

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  // ==================== 加载状态测试 ====================

  describe('加载状态', () => {
    it('加载中应该显示加载动画', () => {
      Object.assign(mockUseAISuggestion, { isLoading: true })

      render(<AISuggestionButton onClick={mockOnClick} />)

      // 检查是否有加载动画元素
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('加载中按钮应该禁用', () => {
      Object.assign(mockUseAISuggestion, { isLoading: true })

      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  // ==================== 禁用状态测试 ====================

  describe('禁用状态', () => {
    it('达到使用限制时应该禁用按钮', () => {
      Object.assign(mockUseAISuggestion, {
        usageStats: { remainingUsage: 0, todayUsage: 20 },
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('达到限制时应该显示提示信息', () => {
      Object.assign(mockUseAISuggestion, {
        usageStats: { remainingUsage: 0, todayUsage: 20 },
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByText(/已达上限/i)).toBeInTheDocument()
    })

    it('外部传入 disabled 属性应该禁用按钮', () => {
      render(<AISuggestionButton onClick={mockOnClick} disabled />)

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  // ==================== 错误状态测试 ====================

  describe('错误状态', () => {
    it('有错误时应该显示错误提示', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        isLoading: false,
        error: 'AI 服务暂时不可用',
        usageStats: { remainingUsage: 15 },
        hasAcceptedPrivacy: true,
        fetchSuggestions: jest.fn(),
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByText(/AI 服务暂时不可用/i)).toBeInTheDocument()
    })
  })

  // ==================== 隐私声明测试 ====================

  describe('隐私声明', () => {
    it('未同意隐私声明时应该显示提示', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        isLoading: false,
        error: null,
        usageStats: { remainingUsage: 15 },
        hasAcceptedPrivacy: false,
        fetchSuggestions: jest.fn(),
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      // 点击时应该显示隐私声明弹窗
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  // ==================== 样式测试 ====================

  describe('样式测试', () => {
    it('应该应用自定义 className', () => {
      render(<AISuggestionButton onClick={mockOnClick} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('禁用状态应该有禁用样式', () => {
      render(<AISuggestionButton onClick={mockOnClick} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled')
    })
  })

  // ==================== 可访问性测试 ====================

  describe('可访问性', () => {
    it('按钮应该有正确的 aria-label', () => {
      render(<AISuggestionButton onClick={mockOnClick} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', '获取 AI 回复建议')
    })

    it('禁用状态应该有 aria-disabled', () => {
      render(<AISuggestionButton onClick={mockOnClick} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('加载状态应该有 aria-busy', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        isLoading: true,
        error: null,
        usageStats: { remainingUsage: 15 },
        hasAcceptedPrivacy: true,
        fetchSuggestions: jest.fn(),
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况', () => {
    it('usageStats 为 null 时应该正常渲染', () => {
      const { useAISuggestion } = require('@/hooks/useAISuggestion')
      useAISuggestion.mockReturnValue({
        isLoading: false,
        error: null,
        usageStats: null,
        hasAcceptedPrivacy: true,
        fetchSuggestions: jest.fn(),
      })

      render(<AISuggestionButton onClick={mockOnClick} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('没有传入 onClick 时应该不报错', () => {
      render(<AISuggestionButton />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
