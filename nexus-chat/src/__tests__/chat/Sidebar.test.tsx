import { fireEvent,render, screen } from '@testing-library/react'

import { Sidebar } from '@/components/chat/Sidebar'

// Mock UI components
jest.mock('@/components/ui', () => ({
  Avatar: ({ name }: { name?: string }) => (
    <div data-testid="avatar">{name || 'User'}</div>
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Modal: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
  Input: (props: any) => (
    <input data-testid="input" placeholder={props.placeholder} />
  ),
}))

// Mock Icons
jest.mock('@/components/ui/Icons', () => ({
  SearchIcon: () => <span data-testid="search-icon">🔍</span>,
  PlusIcon: () => <span data-testid="plus-icon">+</span>,
  LogOutIcon: () => <span data-testid="logout-icon">🚪</span>,
  UsersIcon: () => <span data-testid="users-icon">👥</span>,
  MessageCircleIcon: () => <span data-testid="message-icon">💬</span>,
  XIcon: () => <span data-testid="x-icon">✕</span>,
  ChevronDownIcon: () => <span>▼</span>,
  ChevronRightIcon: () => <span>▶</span>,
  CheckIcon: () => <span>✓</span>,
}))

// Mock ConversationList and FriendList
jest.mock('@/components/chat/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list">ConversationList</div>,
}))

jest.mock('@/components/chat/FriendList', () => ({
  FriendList: () => <div data-testid="friend-list">FriendList</div>,
}))

describe('侧边栏测试', () => {
  it('应该显示用户名', () => {
    render(<Sidebar onLogout={jest.fn()} />)
    expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
  })

  it('应该显示在线状态', () => {
    render(<Sidebar onLogout={jest.fn()} />)
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('默认应该显示消息标签', () => {
    render(<Sidebar onLogout={jest.fn()} />)
    expect(screen.getByText('消息')).toBeInTheDocument()
  })

  it('默认应该显示好友标签', () => {
    render(<Sidebar onLogout={jest.fn()} />)
    expect(screen.getByText('好友')).toBeInTheDocument()
  })

  it('应该显示搜索框', () => {
    render(<Sidebar onLogout={jest.fn()} />)
    expect(screen.getByPlaceholderText('搜索会话...')).toBeInTheDocument()
  })
})
