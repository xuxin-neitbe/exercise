/**
 * 聊天布局组件
 *
 * 职责：
 * - 作为聊天应用的主容器组件
 * - 管理 Socket.io 连接和事件监听
 * - 加载初始数据（会话列表、好友列表）
 * - 协调 Sidebar 和 ChatArea 组件
 *
 * 数据流：
 * 1. 组件挂载后加载会话和好友数据
 * 2. 建立 Socket.io 连接
 * 3. 监听实时事件并更新状态
 * 4. 切换会话时自动加入/离开房间
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'

import { useSocket } from '@/hooks/useSocket'
import { useAuthStore, useChatStore, useUIStore } from '@/stores'

import { ChatArea } from './ChatArea'
import { Sidebar } from './Sidebar'

import styles from './ChatLayout.module.css'

export function ChatLayout() {
    const { user } = useAuthStore()
    const {
        setConversations,
        setFriends,
        addMessage,
        currentConversation,
        setCurrentConversation,
        addTypingUser,
        removeTypingUser,
        setOnlineUser,
        conversations,
        addPendingRequest,
        addFriend
    } = useChatStore()
    const { sidebarOpen } = useUIStore()
    const [mounted, setMounted] = useState(false)

    // 使用 ref 存储状态操作函数，避免作为 useEffect 依赖项
    const addMessageRef = useRef(addMessage)
    const addTypingUserRef = useRef(addTypingUser)
    const removeTypingUserRef = useRef(removeTypingUser)
    const setOnlineUserRef = useRef(setOnlineUser)
    const addPendingRequestRef = useRef(addPendingRequest)
    const addFriendRef = useRef(addFriend)

    // 同步 ref 值
    useEffect(() => {
        addMessageRef.current = addMessage
        addTypingUserRef.current = addTypingUser
        removeTypingUserRef.current = removeTypingUser
        setOnlineUserRef.current = setOnlineUser
        addPendingRequestRef.current = addPendingRequest
        addFriendRef.current = addFriend
    })

    const {
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        onNewMessage,
        onMessageSent,
        onUserStatus,
        onUserTyping,
        onUserStoppedTyping,
        onFriendRequest,
        onFriendRequestAccepted,
        onConversationUpdated,
        getOnlineUsers,
        onOnlineUsersList
    } = useSocket()

    // 确保组件只在客户端渲染
    useEffect(() => {
        setMounted(true)
    }, [])

    /**
     * 加载初始数据
     * 并行请求会话列表和好友列表
     */
    const loadInitialData = useCallback(async () => {
        if (!user) return

        try {
            const [conversationsRes, friendsRes] = await Promise.all([
                fetch('/api/conversations'),
                fetch('/api/friends')
            ])

            const [conversationsData, friendsData] = await Promise.all([
                conversationsRes.json(),
                friendsRes.json()
            ])

            if (conversationsData.data) {
                setConversations(conversationsData.data)
            }

            if (friendsData.data) {
                setFriends(friendsData.data)
            }
        } catch (error) {
            console.error('加载数据失败:', error)
        }
    }, [user, setConversations, setFriends])

    // 用户登录后加载初始数据
    useEffect(() => {
        if (user) {
            loadInitialData()
        }
    }, [user, loadInitialData])

    // 自动选择第一个会话（如果没有选中会话）
    useEffect(() => {
        if (conversations.length > 0 && !currentConversation) {
            console.log('【自动选择】选择第一个会话:', conversations[0].id)
            setCurrentConversation(conversations[0])
        }
    }, [conversations, currentConversation, setCurrentConversation])

    /**
     * 监听 Socket.io 事件
     *
     * 注意：不再依赖 isConnected 状态
     * eventManager.add() 内部会处理：
     * - 如果 socket 已连接，立即注册监听器
     * - 如果 socket 未连接，监听器会在连接成功后自动注册
     *
     * 这样可以避免时序竞态条件：确保监听器在连接建立前就已准备好
     */
    const setupSocketListeners = useCallback(() => {
        console.log('【Socket】设置事件监听器, socket id:', socket?.id)

        // 新消息
        const unsubMessage = onNewMessage((message) => {
            console.log('【Socket】收到 new-message 事件:', message)
            const normalizedMessage = {
                ...message,
                createdAt: typeof message.createdAt === 'string' ? new Date(message.createdAt) : message.createdAt
            }
            addMessageRef.current(normalizedMessage as any)
        })

        // 消息发送确认（用于替换临时消息为真实消息）
        const unsubMessageSent = onMessageSent((data) => {
            console.log('【Socket】收到 message-sent 事件:', data)
            const normalizedMessage = {
                ...data.message,
                createdAt: typeof data.message.createdAt === 'string' ? new Date(data.message.createdAt) : data.message.createdAt
            }
            addMessageRef.current(normalizedMessage as any)
        })

        // 会话更新
        const unsubConv = onConversationUpdated((data) => {
            console.log('Conversation updated:', data)
        })

        // 用户正在输入
        const unsubTyping = onUserTyping((data) => {
            addTypingUserRef.current(data.conversationId, data.userId, data.userName)
        })

        // 用户停止输入
        const unsubStopTyping = onUserStoppedTyping((data) => {
            removeTypingUserRef.current(data.conversationId, data.userId)
        })

        // 用户状态变化
        const unsubStatus = onUserStatus((data) => {
            console.log('【Socket】收到 user-status 事件:', data)
            setOnlineUserRef.current(data.userId, data.status === 'online')
        })

        // 好友请求
        const unsubFriendReq = onFriendRequest((data) => {
            console.log('Friend request received:', data)
            addPendingRequestRef.current({
                id: data.user.id,
                name: data.user.name,
                avatarUrl: data.user.avatarUrl,
                createdAt: new Date(data.createdAt),
                friendshipId: data.id
            })
        })

        // 好友请求被接受
        const unsubFriendAcc = onFriendRequestAccepted((data) => {
            console.log('Friend request accepted:', data)
            if (data.friend) {
                addFriendRef.current({
                    id: data.friend.id,
                    name: data.friend.name,
                    avatarUrl: data.friend.avatarUrl,
                    createdAt: new Date()
                })
            }
        })

        // 在线用户列表响应
        const unsubOnlineUsers = onOnlineUsersList((data) => {
            console.log('【Socket】收到 online-users-list 事件:', data.users)
            data.users.forEach((userId: string) => {
                setOnlineUserRef.current(userId, true)
            })
        })

        // 返回清理函数
        return () => {
            unsubMessage()
            unsubMessageSent()
            unsubConv()
            unsubTyping()
            unsubStopTyping()
            unsubStatus()
            unsubFriendReq()
            unsubFriendAcc()
            unsubOnlineUsers()
        }
    }, [socket, onNewMessage, onMessageSent, onConversationUpdated, onUserTyping, onUserStoppedTyping, onUserStatus, onFriendRequest, onFriendRequestAccepted, onOnlineUsersList])

    // 连接成功后请求在线用户列表（需要在监听器注册后执行）
    useEffect(() => {
        if (isConnected) {
            console.log('【Socket】连接成功，请求在线用户列表')
            getOnlineUsers()
        }
    }, [isConnected, getOnlineUsers])

    useEffect(() => {
        const cleanup = setupSocketListeners()
        return cleanup
    }, [setupSocketListeners])

    /**
     * 加入/离开会话房间
     * 切换会话时自动加入新房间，离开旧房间
     */
    useEffect(() => {
        if (currentConversation && isConnected) {
            console.log('【Socket】加入会话房间:', currentConversation.id)
            joinConversation(currentConversation.id)

            return () => {
                console.log('【Socket】离开会话房间:', currentConversation.id)
                leaveConversation(currentConversation.id)
            }
        }
        return undefined
    }, [currentConversation, isConnected, joinConversation, leaveConversation])

    /**
     * 处理登出
     * 清除 session 并刷新页面
     */
    const handleLogout = async () => {
        await signOut({ redirect: false })
        window.location.reload()
    }

    // 服务端渲染时显示加载状态
    if (!mounted) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
                <Sidebar onLogout={handleLogout} />
            </aside>
            <main className={styles.main}>
                <ChatArea />
            </main>
        </div>
    )
}
