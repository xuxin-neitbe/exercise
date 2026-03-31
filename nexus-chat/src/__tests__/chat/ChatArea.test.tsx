import { render, screen } from '@testing-library/react'

import { ChatArea } from '@/components/chat/ChatArea'

describe('聊天区域测试', () => {
  it('应该显示空状态提示', () => {
    render(<ChatArea />)
    expect(screen.getByText('选择一个会话开始聊天')).toBeInTheDocument()
  })

  it('应该显示说明文字', () => {
    render(<ChatArea />)
    expect(screen.getByText(/从左侧列表选择会话/)).toBeInTheDocument()
  })
})
