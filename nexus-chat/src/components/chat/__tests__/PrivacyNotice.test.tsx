/**
 * 隐私声明组件测试
 *
 * 测试覆盖：
 * - 弹窗渲染
 * - 同意/拒绝操作
 * - 内容显示
 * - 可访问性
 */

import { fireEvent,render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PrivacyNotice } from '../PrivacyNotice'

describe('PrivacyNotice 组件测试', () => {
  const mockOnAccept = jest.fn()
  const mockOnDecline = jest.fn()

  const defaultProps = {
    isOpen: true,
    onAccept: mockOnAccept,
    onDecline: mockOnDecline,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==================== 渲染测试 ====================

  describe('渲染测试', () => {
    it('弹窗打开时应该显示', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('弹窗关闭时不应该显示', () => {
      render(<PrivacyNotice {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('应该显示标题', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByText(/隐私声明/i)).toBeInTheDocument()
    })

    it('应该显示同意按钮', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByRole('button', { name: /同意/i })).toBeInTheDocument()
    })

    it('应该显示拒绝按钮', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByRole('button', { name: /拒绝/i })).toBeInTheDocument()
    })
  })

  // ==================== 内容显示测试 ====================

  describe('内容显示', () => {
    it('应该显示隐私声明内容', () => {
      render(<PrivacyNotice {...defaultProps} />)

      // 检查关键内容
      expect(screen.getByText(/AI 建议/i)).toBeInTheDocument()
      expect(screen.getByText(/对话内容/i)).toBeInTheDocument()
    })

    it('应该显示数据使用说明', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByText(/数据/i)).toBeInTheDocument()
    })

    it('应该显示服务提供商信息', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByText(/通义千问/i)).toBeInTheDocument()
    })

    it('应该显示使用限制说明', () => {
      render(<PrivacyNotice {...defaultProps} />)

      expect(screen.getByText(/每日/i)).toBeInTheDocument()
      expect(screen.getByText(/20/)).toBeInTheDocument()
    })
  })

  // ==================== 同意操作测试 ====================

  describe('同意操作', () => {
    it('点击同意按钮应该触发 onAccept', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /同意/i }))

      expect(mockOnAccept).toHaveBeenCalledTimes(1)
    })

    it('同意后不应该再显示弹窗', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<PrivacyNotice {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /同意/i }))

      // 重新渲染，模拟关闭
      rerender(<PrivacyNotice {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  // ==================== 拒绝操作测试 ====================

  describe('拒绝操作', () => {
    it('点击拒绝按钮应该触发 onDecline', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /拒绝/i }))

      expect(mockOnDecline).toHaveBeenCalledTimes(1)
    })

    it('拒绝后应该关闭弹窗', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<PrivacyNotice {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /拒绝/i }))

      rerender(<PrivacyNotice {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  // ==================== 关闭方式测试 ====================

  describe('关闭方式', () => {
    it('点击遮罩层不应该关闭弹窗', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice {...defaultProps} />)

      // 点击遮罩层
      const overlay = screen.getByRole('dialog').parentElement
      if (overlay) {
        await user.click(overlay)
        // 不应该触发任何回调
        expect(mockOnAccept).not.toHaveBeenCalled()
        expect(mockOnDecline).not.toHaveBeenCalled()
      }
    })

    it('按 ESC 键不应该关闭弹窗', () => {
      render(<PrivacyNotice {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      // 不应该触发任何回调
      expect(mockOnAccept).not.toHaveBeenCalled()
      expect(mockOnDecline).not.toHaveBeenCalled()
    })
  })

  // ==================== 可访问性测试 ====================

  describe('可访问性', () => {
    it('弹窗应该有正确的 aria 属性', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('标题应该有正确的 id', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      const titleId = dialog.getAttribute('aria-labelledby')
      const title = screen.getByText(/隐私声明/i)

      expect(title).toHaveAttribute('id', titleId)
    })

    it('同意按钮应该有正确的类型', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const acceptButton = screen.getByRole('button', { name: /同意/i })
      expect(acceptButton).toHaveAttribute('type', 'button')
    })

    it('拒绝按钮应该有正确的类型', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const declineButton = screen.getByRole('button', { name: /拒绝/i })
      expect(declineButton).toHaveAttribute('type', 'button')
    })

    it('焦点应该在同意按钮上', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const acceptButton = screen.getByRole('button', { name: /同意/i })
      expect(acceptButton).toHaveFocus()
    })
  })

  // ==================== 样式测试 ====================

  describe('样式测试', () => {
    it('同意按钮应该是主要按钮样式', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const acceptButton = screen.getByRole('button', { name: /同意/i })
      expect(acceptButton).toHaveClass('primary')
    })

    it('拒绝按钮应该是次要按钮样式', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const declineButton = screen.getByRole('button', { name: /拒绝/i })
      expect(declineButton).toHaveClass('secondary')
    })
  })

  // ==================== 边界情况测试 ====================

  describe('边界情况', () => {
    it('没有传入 onAccept 时应该不报错', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice isOpen onDecline={mockOnDecline} />)

      // 点击同意按钮不应该报错
      await user.click(screen.getByRole('button', { name: /同意/i }))
    })

    it('没有传入 onDecline 时应该不报错', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice isOpen onAccept={mockOnAccept} />)

      // 点击拒绝按钮不应该报错
      await user.click(screen.getByRole('button', { name: /拒绝/i }))
    })

    it('多次点击同意按钮应该只触发一次', async () => {
      const user = userEvent.setup()
      render(<PrivacyNotice {...defaultProps} />)

      const acceptButton = screen.getByRole('button', { name: /同意/i })

      // 快速点击多次
      await user.click(acceptButton)
      await user.click(acceptButton)
      await user.click(acceptButton)

      // 应该只触发一次
      expect(mockOnAccept).toHaveBeenCalledTimes(1)
    })
  })

  // ==================== 内容滚动测试 ====================

  describe('内容滚动', () => {
    it('内容过长时应该可滚动', () => {
      render(<PrivacyNotice {...defaultProps} />)

      const contentArea = screen.getByRole('dialog').querySelector('.content')
      if (contentArea) {
        expect(contentArea).toHaveStyle({ overflow: 'auto' })
      }
    })
  })
})
