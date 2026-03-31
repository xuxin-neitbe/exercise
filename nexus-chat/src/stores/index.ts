/**
 * 状态管理层（State Management Layer）
 *
 * 使用 Zustand 进行全局状态管理
 *
 * 职责：
 * - 管理应用的全局状态
 * - 提供状态的读写接口
 * - 处理状态的更新逻辑
 *
 * 状态分类：
 * - AuthState: 认证状态（用户信息、登录状态）
 * - ChatState: 聊天状态（会话、消息、好友）
 * - UIState: UI 状态（侧边栏、弹窗）
 *
 * 设计原则：
 * - 状态应该是不可变的（通过 set 创建新对象）
 * - 复杂的状态更新逻辑封装在 store 内部
 * - 组件只负责调用 action，不直接修改状态
 */
'use client'

import type { Session } from 'next-auth'
import { create } from 'zustand'

// ==================== 类型定义 ====================

/**
 * 用户信息类型
 * 从 NextAuth session 扩展，包含用户基本信息
 */
interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
}

// ==================== 认证状态 Store ====================

/**
 * 认证状态接口
 *
 * 管理用户的登录状态和基本信息
 * 与 NextAuth session 同步
 */
interface AuthState {
    user: User | null
    session: Session | null
    status: 'loading' | 'authenticated' | 'unauthenticated'
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setStatus: (status: 'loading' | 'authenticated' | 'unauthenticated') => void
    logout: () => void
}

/**
 * 认证状态 Store
 *
 * 状态说明：
 * - user: 当前登录用户信息
 * - session: NextAuth session 对象
 * - status: 认证状态（loading/authenticated/unauthenticated）
 */
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    status: 'loading',
    setUser: (user) => set({ user }),
    // 设置 session 时同时更新 user
    setSession: (session) => set({ session, user: session?.user as User || null }),
    setStatus: (status) => set({ status }),
    // 登出时清空所有认证信息
    logout: () => set({ user: null, session: null, status: 'unauthenticated' })
}))

// ==================== 聊天相关类型 ====================

/**
 * 会话类型
 * 包含会话基本信息、成员和最新消息
 */
export interface Conversation {
    id: string
    name: string | null
    isGroup: boolean
    createdAt: Date
    updatedAt: Date
    members?: {
        userId: string
        user: {
            id: string
            name: string | null
            avatarUrl: string | null
        }
    }[]
    messages?: {
        id: string
        content: string
        createdAt: Date
        senderId: string
    }[]
}

/**
 * 消息类型
 * 包含消息内容和发送者信息
 */
export interface Message {
    id: string
    conversationId: string
    senderId: string
    content: string
    createdAt: Date
    sender: {
        id: string
        name: string | null
        avatarUrl: string | null
    }
}

/**
 * 好友类型
 * 包含好友的基本信息
 */
export interface Friend {
    id: string
    name: string | null
    avatarUrl: string | null
    createdAt: Date
}

/**
 * 好友请求类型
 * 继承 Friend，额外包含好友关系 ID（用于接受/拒绝请求）
 */
export interface FriendRequest extends Friend {
    friendshipId: string
}

// ==================== 聊天状态 Store ====================

/**
 * 聊天状态接口
 *
 * 管理聊天相关的所有状态：
 * - 会话列表和当前会话
 * - 消息记录（按会话 ID 分组）
 * - 好友列表和好友请求
 * - 输入状态和在线状态
 */
interface ChatState {
    // 会话相关
    conversations: Conversation[]
    currentConversation: Conversation | null
    // 消息相关（按会话 ID 分组存储）
    messages: Map<string, Message[]>
    // 好友相关
    friends: Friend[]
    pendingRequests: FriendRequest[]
    // 实时状态
    typingUsers: Map<string, { userId: string; userName: string }[]>
    onlineUsers: Set<string>

    // 会话操作
    setConversations: (conversations: Conversation[]) => void
    addConversation: (conversation: Conversation) => void
    setCurrentConversation: (conversation: Conversation | null) => void
    // 消息操作
    setMessages: (conversationId: string, messages: Message[]) => void
    addMessage: (message: Message) => void
    prependMessages: (conversationId: string, messages: Message[]) => void
    // 好友操作
    setFriends: (friends: Friend[]) => void
    addFriend: (friend: Friend) => void
    removeFriend: (friendId: string) => void
    setPendingRequests: (requests: FriendRequest[]) => void
    addPendingRequest: (request: FriendRequest) => void
    removePendingRequest: (friendshipId: string) => void
    // 实时状态操作
    addTypingUser: (conversationId: string, userId: string, userName: string) => void
    removeTypingUser: (conversationId: string, userId: string) => void
    setOnlineUser: (userId: string, online: boolean) => void
    // 重置状态
    reset: () => void
}

// 输入状态的初始值
const initialTypingUsers = new Map<string, { userId: string; userName: string }[]>()

// 性能优化：消息存储上限，防止内存泄漏
const MAX_MESSAGES_PER_CONVERSATION = 100

/**
 * 聊天状态 Store
 *
 * 状态说明：
 * - conversations: 用户的所有会话列表
 * - currentConversation: 当前选中的会话
 * - messages: 消息记录，key 为会话 ID，value 为消息数组
 * - friends: 好友列表
 * - pendingRequests: 待处理的好友请求
 * - typingUsers: 正在输入的用户（按会话分组）
 * - onlineUsers: 在线用户 ID 集合
 */
export const useChatStore = create<ChatState>((set) => ({
    conversations: [],
    currentConversation: null,
    messages: new Map(),
    friends: [],
    pendingRequests: [],
    typingUsers: initialTypingUsers,
    onlineUsers: new Set(),

    // 设置会话列表
    setConversations: (conversations) => set({ conversations }),

    // 添加新会话到列表开头
    addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
    })),

    // 设置当前会话
    setCurrentConversation: (conversation) => set({
        currentConversation: conversation
    }),

    // 设置指定会话的消息列表
    setMessages: (conversationId, messages) => set((state) => {
        const newMessages = new Map(state.messages)
        newMessages.set(conversationId, messages)
        return { messages: newMessages }
    }),

    // 添加新消息到对应会话
    // 注意：消息数组保持倒序（最新在前），配合 CSS column-reverse 实现新消息在底部
    // 所以新消息需要添加到数组开头，这样在 column-reverse 布局下会显示在底部
    // 性能优化：限制消息数量，防止内存无限增长
    // 去重逻辑：防止消息重复显示
    addMessage: (message) => {
        set((state) => {
            const conversationMessages = state.messages.get(message.conversationId) || []
            
            // 去重检查：如果消息 ID 已存在，跳过添加
            const existsById = conversationMessages.some(m => m.id === message.id)
            if (existsById) {
                return state
            }
            
            // 临时消息替换逻辑：如果存在相同发送者+内容的临时消息，用真实消息替换
            const isTempMessage = message.id.startsWith('temp-')
            let filteredMessages = conversationMessages
            
            if (!isTempMessage) {
                // 真实消息：查找并移除匹配的临时消息
                filteredMessages = conversationMessages.filter(m => 
                    !(m.id.startsWith('temp-') && 
                      m.senderId === message.senderId && 
                      m.content === message.content)
                )
            }
            
            // 限制消息数量，保留最新的 N 条
            const newMessages = [message, ...filteredMessages].slice(0, MAX_MESSAGES_PER_CONVERSATION)
            const updatedMessages = new Map(state.messages)
            updatedMessages.set(message.conversationId, newMessages)
            return { messages: updatedMessages }
        })
    },

    // 在消息列表末尾追加历史消息（用于分页加载更早的消息）
    // 历史消息（更早）应该添加到数组末尾，在 column-reverse 布局下会显示在顶部
    prependMessages: (conversationId, messages) => set((state) => {
        const conversationMessages = state.messages.get(conversationId) || []
        const updatedMessages = new Map(state.messages)
        updatedMessages.set(conversationId, [...conversationMessages, ...messages])
        return { messages: updatedMessages }
    }),

    // 设置好友列表
    setFriends: (friends) => set({ friends }),

    // 添加好友
    addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
    })),

    // 移除好友
    removeFriend: (friendId) => set((state) => ({
        friends: state.friends.filter(f => f.id !== friendId)
    })),

    // 设置待处理的好友请求
    setPendingRequests: (requests) => set({ pendingRequests: requests }),

    // 添加单个好友请求（用于实时接收）
    addPendingRequest: (request) => set((state) => {
        // 避免重复添加
        if (state.pendingRequests.some(r => r.friendshipId === request.friendshipId)) {
            return state
        }
        return { pendingRequests: [request, ...state.pendingRequests] }
    }),

    // 移除好友请求（接受或拒绝后）
    removePendingRequest: (friendshipId) => set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.friendshipId !== friendshipId)
    })),

    // 添加正在输入的用户
    addTypingUser: (conversationId, userId, userName) => set((state) => {
        const newTypingUsers = new Map(state.typingUsers)
        const users = newTypingUsers.get(conversationId) || []
        // 避免重复添加
        if (!users.find(u => u.userId === userId)) {
            newTypingUsers.set(conversationId, [...users, { userId, userName }])
        }
        return { typingUsers: newTypingUsers }
    }),

    // 移除正在输入的用户
    removeTypingUser: (conversationId, userId) => set((state) => {
        const newTypingUsers = new Map(state.typingUsers)
        const users = newTypingUsers.get(conversationId) || []
        newTypingUsers.set(conversationId, users.filter(u => u.userId !== userId))
        return { typingUsers: newTypingUsers }
    }),

    // 设置用户在线状态
    setOnlineUser: (userId, online) => set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers)
        if (online) {
            newOnlineUsers.add(userId)
        } else {
            newOnlineUsers.delete(userId)
        }
        return { onlineUsers: newOnlineUsers }
    }),

    // 重置所有状态（登出时调用）
    reset: () => set({
        conversations: [],
        currentConversation: null,
        messages: new Map(),
        friends: [],
        pendingRequests: [],
        typingUsers: initialTypingUsers,
        onlineUsers: new Set()
    })
}))

// ==================== UI 状态 Store ====================

/**
 * UI 状态接口
 *
 * 管理 UI 相关的状态：
 * - 侧边栏展开/收起
 * - 弹窗状态
 * - 搜索关键词
 */
interface UIState {
    sidebarOpen: boolean
    addFriendModalOpen: boolean
    createGroupModalOpen: boolean
    searchQuery: string
    toggleSidebar: () => void
    setAddFriendModalOpen: (open: boolean) => void
    setCreateGroupModalOpen: (open: boolean) => void
    setSearchQuery: (query: string) => void
}

/**
 * UI 状态 Store
 *
 * 管理应用 UI 的状态，与业务逻辑分离
 */
export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    addFriendModalOpen: false,
    createGroupModalOpen: false,
    searchQuery: '',
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setAddFriendModalOpen: (open) => set({ addFriendModalOpen: open }),
    setCreateGroupModalOpen: (open) => set({ createGroupModalOpen: open }),
    setSearchQuery: (query) => set({ searchQuery: query })
}))

// ==================== AI 建议状态 Store ====================

/**
 * AI 建议状态接口
 *
 * 管理 AI 建议功能的相关状态：
 * - 建议面板的显示状态
 * - 隐私声明弹窗状态
 * - 当前选中的建议
 */
interface AISuggestionState {
    // 面板状态
    isSuggestionPanelOpen: boolean
    isPrivacyNoticeOpen: boolean
    // 选中的建议内容
    selectedSuggestionContent: string | null
    // 操作方法
    openSuggestionPanel: () => void
    closeSuggestionPanel: () => void
    toggleSuggestionPanel: () => void
    openPrivacyNotice: () => void
    closePrivacyNotice: () => void
    setSelectedSuggestion: (content: string | null) => void
}

/**
 * AI 建议状态 Store
 *
 * 管理 AI 建议功能的 UI 状态
 */
export const useAISuggestionStore = create<AISuggestionState>((set) => ({
    isSuggestionPanelOpen: false,
    isPrivacyNoticeOpen: false,
    selectedSuggestionContent: null,

    // 打开建议面板
    openSuggestionPanel: () => set({ isSuggestionPanelOpen: true }),

    // 关闭建议面板
    closeSuggestionPanel: () => set({
        isSuggestionPanelOpen: false,
        selectedSuggestionContent: null
    }),

    // 切换建议面板
    toggleSuggestionPanel: () => set((state) => ({
        isSuggestionPanelOpen: !state.isSuggestionPanelOpen
    })),

    // 打开隐私声明
    openPrivacyNotice: () => {
        set({ isPrivacyNoticeOpen: true })
    },

    // 关闭隐私声明
    closePrivacyNotice: () => {
        set({ isPrivacyNoticeOpen: false })
    },

    // 设置选中的建议
    setSelectedSuggestion: (content) => set({ selectedSuggestionContent: content }),
}))
