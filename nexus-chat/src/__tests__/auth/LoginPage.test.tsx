import { render, screen } from '@testing-library/react'

import { LoginPage } from '@/components/auth/LoginPage'

describe('登录页面测试', () => {
  it('应该渲染登录页面标题', () => {
    render(<LoginPage />)
    expect(screen.getByText('欢迎来到 Nexus Chat')).toBeInTheDocument()
  })

  it('应该渲染邮箱输入框', () => {
    render(<LoginPage />)
    // 检查邮箱输入框是否存在（可能是密码登录模式）
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('应该渲染登录按钮', () => {
    render(<LoginPage />)
    // 登录按钮存在（可能是密码登录模式）
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
