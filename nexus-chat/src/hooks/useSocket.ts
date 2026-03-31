/**
 * Socket.io 自定义 Hook
 *
 * 职责：
 * - 管理 Socket.io 客户端连接
 * - 提供实时通信的发送和监听接口
 * - 处理连接生命周期（连接、断开、重连）
 *
 * 使用方式：
 * ```tsx
 * const { sendMessage, onNewMessage, joinConversation } = useSocket()
 *
 * // 加入会话
 * joinConversation(conversationId)
 *
 * // 发送消息
 * sendMessage(conversationId, content)
 *
 * // 监听新消息
 * useEffect(() => {
 *   return onNewMessage((message) => {
 *     // 处理新消息
 *   })
 * }, [])
 * ```
 *
 * 连接策略：
 * - 用户登录后自动连接
 * - 支持自动重连（最多 5 次）
 * - 组件卸载时自动断开
 *
 * 事件监听策略：
 * - 使用事件管理器统一管理所有监听器
 * - Socket 连接成功后自动重新注册所有监听器
 * - 解决闭包陷阱问题
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'

import { useAuthStore } from '@/stores'

// Socket 服务器地址
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

// ==================== 单例模式：全局 Socket 实例 ====================
let socketInstance: Socket | null = null
let connectionUserId: string | null = null
let isConnecting = false

// ==================== 事件监听器管理器 ====================
type EventCallback = (...args: unknown[]) => void
type EventName = string

interface EventManager {
  // 存储所有已注册的监听器：eventName -> Set<callback>
  listeners: Map<EventName, Set<EventCallback>>
  // 注册监听器
  add: (eventName: EventName, callback: EventCallback) => () => void
  // 移除监听器
  remove: (eventName: EventName, callback: EventCallback) => void
  // 将所有监听器注册到 socket
  registerAll: (socket: Socket) => void
  // 从 socket 移除所有监听器
  unregisterAll: (socket: Socket) => void
}

// 创建全局事件管理器单例
const createEventManager = (): EventManager => {
  const listeners = new Map<EventName, Set<EventCallback>>()

  return {
    listeners,

    add: (eventName: EventName, callback: EventCallback) => {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set())
      }

      const existingCallbacks = listeners.get(eventName)!
      existingCallbacks.add(callback)

      // 如果 socket 已连接，立即注册此监听器
      if (socketInstance?.connected) {
        socketInstance.on(eventName, callback)
      }

      // 返回取消监听函数
      return () => {
        existingCallbacks.delete(callback)
        socketInstance?.off(eventName, callback)
      }
    },

    remove: (eventName: EventName, callback: EventCallback) => {
      listeners.get(eventName)?.delete(callback)
      socketInstance?.off(eventName, callback)
    },

    registerAll: (socket: Socket) => {
      listeners.forEach((callbacks, eventName) => {
        callbacks.forEach(callback => {
          socket.on(eventName, callback)
        })
      })
    },

    unregisterAll: (socket: Socket) => {
      listeners.forEach((callbacks, eventName) => {
        callbacks.forEach(callback => {
          socket.off(eventName, callback)
        })
      })
    }
  }
}

// 全局事件管理器实例
const eventManager = createEventManager()

// ==================== 事件类型定义 ====================

/**
 * 新消息事件类型
 * 收到新消息时触发
 */
type NewMessageEvent = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: Date | string
  sender: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

/**
 * 用户状态事件类型
 * 用户上线/下线时触发
 */
type UserStatusEvent = {
  userId: string
  status: 'online' | 'offline'
  timestamp: Date
}

/**
 * 在线用户列表事件类型
 */
type OnlineUsersEvent = {
  users: string[]
}

/**
 * 输入状态事件类型
 * 用户开始输入时触发
 */
type TypingEvent = {
  userId: string
  userName: string
  conversationId: string
}

/**
 * 好友请求事件类型
 * 收到好友请求时触发
 */
type FriendRequestEvent = {
  id: string
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
  createdAt: string
}

/**
 * 消息发送确认事件类型
 * 服务端确认消息已保存后触发，用于替换临时消息
 */
type MessageSentEvent = {
  tempId: string
  message: NewMessageEvent
}

/**
 * Socket.io Hook
 *
 * 返回值：
 * - socket: Socket 实例
 * - joinConversation: 加入会话房间
 * - leaveConversation: 离开会话房间
 * - sendMessage: 发送消息
 * - startTyping: 通知开始输入
 * - stopTyping: 通知停止输入
 * - sendFriendRequest: 发送好友请求
 * - acceptFriend: 接受好友请求
 * - onNewMessage: 监听新消息
 * - onUserStatus: 监听用户状态变化
 * - onUserTyping: 监听用户输入状态
 * - onUserStoppedTyping: 监听用户停止输入
 * - onFriendRequest: 监听好友请求
 * - onFriendRequestAccepted: 监听好友请求被接受
 * - onConversationUpdated: 监听会话更新
 * - isConnected: 是否已连接
 */
export function useSocket() {
  // 使用 ref 存储 Socket 实例，避免重渲染
  const socketRef = useRef<Socket | null>(null)
  // 使用 state 强制触发重渲染
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuthStore()

  // ==================== 连接管理 ====================

  /**
   * 建立 Socket 连接（单例模式）
   * 整个应用共享同一个 Socket 连接
   *
   * 连接配置：
   * - auth: 携带用户 ID 和 JWT token 用于认证
   * - transports: 优先使用 WebSocket，降级到轮询
   * - reconnection: 启用自动重连
   * - reconnectionAttempts: 最多重连 5 次
   * - reconnectionDelay: 重连间隔 1 秒
   */
  useEffect(() => {
    if (!user?.id) return

    // 如果已有相同用户的连接，直接复用
    if (socketInstance && connectionUserId === user.id && socketInstance.connected) {
      console.log('【Socket】复用已有连接:', socketInstance.id, 'userId:', user.id)
      setIsConnected(true)
      return
    }

    // 如果正在连接中，稍后重试
    if (isConnecting) {
      console.log('【Socket】正在连接中，跳过')
      return
    }

    // 如果有不同的用户 ID，先断开旧连接
    if (socketInstance && connectionUserId !== user.id) {
      console.log('【Socket】用户切换，断开旧连接')
      socketInstance.disconnect()
      socketInstance = null
      connectionUserId = null
    }

    let socketToken: string | null = null

    const connectSocket = async () => {
      isConnecting = true
      try {
        const res = await fetch('/api/auth/socket-token')
        const data = await res.json()
        if (data.token) {
          socketToken = data.token
        }
      } catch (error) {
        console.error('获取Socket token失败:', error)
      }

      socketInstance = io(SOCKET_URL, {
        auth: {
          userId: user.id,
          token: socketToken
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      const socket = socketInstance
      connectionUserId = user.id

      socket.on('connect', () => {
        console.log('【Socket】连接成功! socket.id:', socket.id)
        setIsConnected(true)
        isConnecting = false
        // 连接成功后，重新注册所有已保存的监听器
        eventManager.registerAll(socket)
        console.log('【Socket】已重新注册所有事件监听器')
      })

      socket.on('connect_error', (error) => {
        console.error('【Socket】连接错误:', error.message)
        setIsConnected(false)
        isConnecting = false
      })

      socket.on('disconnect', (reason) => {
        console.log('【Socket】断开连接:', reason)
        setIsConnected(false)
      })

      socket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message)
      })
    }

    connectSocket()

    // 注意：这里不自动断开连接，保持全局单例
    // 只有在用户登出时才需要手动断开
    return () => {
      // 不在这里断开连接，因为是单例模式
      // 如果需要完全断开，可以提供专门的登出方法
    }
  }, [user?.id])

  // ==================== 会话操作 ====================

  /**
   * 加入会话房间
   * 加入后才能收到该会话的消息
   *
   * 处理策略：
   * - 如果已连接，立即发送加入请求
   * - 如果未连接，等待连接成功后再发送
   */
  const joinConversation = useCallback((conversationId: string) => {
    if (socketInstance?.connected) {
      console.log('【Socket】加入会话房间（已连接）:', conversationId)
      socketInstance.emit('join-conversation', conversationId)
    } else if (socketInstance) {
      console.log('【Socket】等待连接后加入会话房间:', conversationId)
      // 等待连接成功后再加入
      const onConnect = () => {
        console.log('【Socket】连接成功，执行加入会话房间:', conversationId)
        socketInstance?.emit('join-conversation', conversationId)
        socketInstance?.off('connect', onConnect)
      }
      socketInstance.on('connect', onConnect)
    } else {
      console.warn('【Socket】socketInstance 不存在，无法加入会话房间')
    }
  }, [])

  /**
   * 离开会话房间
   * 离开后不再收到该会话的消息
   */
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('leave-conversation', conversationId)
    }
    // 如果未连接，无需离开房间（本来就没加入）
  }, [])

  // ==================== 消息操作 ====================

  /**
   * 发送消息
   * 通过 Socket 实时发送，无需等待 HTTP 响应
   */
  const sendMessage = useCallback((conversationId: string, content: string) => {
    console.log('【Socket】发送消息:', { conversationId, content })
    socketInstance?.emit('send-message', { conversationId, content })
  }, [])

  // ==================== 输入状态 ====================

  /**
   * 通知开始输入
   * 会话中的其他用户会收到输入提示
   */
  const startTyping = useCallback((conversationId: string) => {
    socketInstance?.emit('typing-start', conversationId)
  }, [])

  /**
   * 通知停止输入
   * 发送消息或停止输入时调用
   */
  const stopTyping = useCallback((conversationId: string) => {
    socketInstance?.emit('typing-stop', conversationId)
  }, [])

  // ==================== 好友操作 ====================

  /**
   * 发送好友请求
   */
  const sendFriendRequest = useCallback((friendId: string) => {
    socketInstance?.emit('friend-request', { friendId })
  }, [])

  /**
   * 接受好友请求
   */
  const acceptFriend = useCallback((friendshipId: string) => {
    socketInstance?.emit('accept-friend', { friendshipId })
  }, [])

  // ==================== 事件监听 ====================

  /**
   * 监听新消息
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onNewMessage = useCallback((callback: (message: NewMessageEvent) => void) => {
    console.log('【Socket】注册 new-message 监听器')
    return eventManager.add('new-message', callback as EventCallback)
  }, [])

  /**
   * 监听用户状态变化（上线/下线）
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onUserStatus = useCallback((callback: (data: UserStatusEvent) => void) => {
    console.log('【Socket】注册 user-status 监听器')
    return eventManager.add('user-status', callback as EventCallback)
  }, [])

  /**
   * 监听用户输入状态
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onUserTyping = useCallback((callback: (data: TypingEvent) => void) => {
    return eventManager.add('user-typing', callback as EventCallback)
  }, [])

  /**
   * 监听用户停止输入
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onUserStoppedTyping = useCallback((callback: (data: { userId: string; conversationId: string }) => void) => {
    return eventManager.add('user-stopped-typing', callback as EventCallback)
  }, [])

  /**
   * 监听好友请求
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onFriendRequest = useCallback((callback: (data: FriendRequestEvent) => void) => {
    return eventManager.add('friend-request-received', callback as EventCallback)
  }, [])

  /**
   * 监听好友请求被接受
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onFriendRequestAccepted = useCallback((callback: (data: {
    id: string
    friendId: string
    friend: {
      id: string
      name: string | null
      avatarUrl: string | null
    }
  }) => void) => {
    return eventManager.add('friend-request-accepted', callback as EventCallback)
  }, [])

  /**
   * 监听会话更新（新消息、成员变化等）
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onConversationUpdated = useCallback((callback: (data: { conversationId: string; lastMessage: NewMessageEvent }) => void) => {
    return eventManager.add('conversation-updated', callback as EventCallback)
  }, [])

  /**
   * 监听消息发送确认
   * 服务端确认消息已保存后触发，用于替换临时消息为真实消息
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onMessageSent = useCallback((callback: (data: MessageSentEvent) => void) => {
    console.log('【Socket】注册 message-sent 监听器')
    return eventManager.add('message-sent', callback as EventCallback)
  }, [])

  // ==================== 在线用户列表 ====================

  /**
   * 请求获取当前所有在线用户列表
   */
  const getOnlineUsers = useCallback(() => {
    console.log('【Socket】发送 get-online-users 事件')
    socketInstance?.emit('get-online-users')
  }, [])

  /**
   * 监听在线用户列表响应
   * 使用事件管理器注册，解决闭包陷阱问题
   * @returns 取消监听函数
   */
  const onOnlineUsersList = useCallback((callback: (data: OnlineUsersEvent) => void) => {
    console.log('【Socket】注册 online-users-list 监听器')
    return eventManager.add('online-users-list', callback as EventCallback)
  }, [])

  /**
   * 断开 Socket 连接（用于登出）
   */
  const disconnectSocket = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
      connectionUserId = null
      setIsConnected(false)
    }
  }, [])

  return {
    socket: socketInstance,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    sendFriendRequest,
    acceptFriend,
    onNewMessage,
    onMessageSent,
    onUserStatus,
    onUserTyping,
    onUserStoppedTyping,
    onFriendRequest,
    onFriendRequestAccepted,
    onConversationUpdated,
    getOnlineUsers,
    onOnlineUsersList,
    disconnectSocket
  }
}
