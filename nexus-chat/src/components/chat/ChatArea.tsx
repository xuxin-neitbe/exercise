/**
 * 聊天区域组件
 *
 * 职责：
 * - 显示当前会话的消息列表
 * - 处理消息发送
 * - 管理输入状态（正在输入提示）
 * - 自动滚动到最新消息
 * - AI 对话建议功能
 *
 * 功能：
 * - 消息加载（分页）
 * - 实时消息接收（通过 Socket.io）
 * - 输入状态通知
 * - 消息时间格式化
 * - AI 建议生成与选择
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/ui'
import { MenuIcon, SendIcon } from '@/components/ui/Icons'
import { useAISuggestion } from '@/hooks/useAISuggestion'
import { useSocket } from '@/hooks/useSocket'
import { useAISuggestionStore, useAuthStore, useChatStore, useUIStore } from '@/stores'
import type { AIMessageContext } from '@/types/ai'

import { AISuggestionButton } from './AISuggestionButton'
import { AISuggestionPanel } from './AISuggestionPanel'
import { PrivacyNotice } from './PrivacyNotice'

import styles from './ChatArea.module.css'

export function ChatArea() {
    // 从状态管理获取当前会话和消息
    const { currentConversation, messages, setMessages, addMessage } = useChatStore()
    const { user } = useAuthStore()
    const { toggleSidebar, sidebarOpen } = useUIStore()
    // 获取 Socket 发送消息方法，用于实时通信
    const { startTyping, stopTyping, sendMessage: socketSendMessage, isConnected } = useSocket()

    // AI 建议相关状态
    const {
        isSuggestionPanelOpen,
        isPrivacyNoticeOpen,
        openSuggestionPanel,
        closeSuggestionPanel,
        openPrivacyNotice,
        closePrivacyNotice,
        setSelectedSuggestion,
    } = useAISuggestionStore()

    // AI 建议 Hook
    const {
        suggestions,
        isLoading: isAILoading,
        error: aiError,
        usageStats,
        fetchSuggestions: fetchSuggestionsFromHook,
        retry: retryAI,
        clearError,
        submitFeedback,
    } = useAISuggestion()

    // 本地状态
    const [inputValue, setInputValue] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(false)

    // Refs 用于 DOM 操作和定时器
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 获取当前会话的消息列表
    const currentMessages = currentConversation ? messages.get(currentConversation.id) || [] : []

    /**
     * 滚动到底部
     * 新消息或切换会话时触发
     */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    // 消息变化时滚动到底部
    useEffect(() => {
        scrollToBottom()
    }, [currentMessages, scrollToBottom])

    /**
     * 组件卸载时清理定时器
     * 防止内存泄漏
     */
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    /**
     * 加载会话消息
     * 切换会话时从 API 获取历史消息
     */
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentConversation) return

            setLoading(true)
            try {
                const res = await fetch(`/api/conversations/${currentConversation.id}/messages?limit=50`)
                const data = await res.json()

                // API 返回的消息是倒序（最新在前），直接存储
                // 使用 CSS column-reverse 实现新消息在底部的效果
                if (data.data) {
                    setMessages(currentConversation.id, data.data)
                }
            } catch (error) {
                console.error('加载消息失败:', error)
            } finally {
                setLoading(false)
            }
        }

        loadMessages()
    }, [currentConversation, setMessages])

    /**
     * 处理输入变化
     * 同时通知其他用户正在输入
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value)

        // 通知正在输入
        if (currentConversation) {
            startTyping(currentConversation.id)

            // 清除之前的超时
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            // 3秒后停止输入状态
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(currentConversation.id)
            }, 3000)
        }
    }

    /**
     * 发送消息
     *
     * 优先使用 Socket.io 实时发送（更快），降级到 HTTP API
     * Socket.io 方式：服务端广播 new-message 事件，所有客户端（包括自己）收到后更新状态
     * 同时进行乐观更新：立即显示消息到界面，提升用户体验
     */
    const handleSendMessage = async () => {
        if (!inputValue.trim() || !currentConversation || sending) return

        const content = inputValue.trim()
        const now = new Date()

        // 创建临时消息对象（乐观更新）
        const tempMessage = {
            id: `temp-${Date.now()}`,
            conversationId: currentConversation.id,
            senderId: user?.id || '',
            content,
            createdAt: now,
            sender: {
                id: user?.id || '',
                name: user?.name || null,
                avatarUrl: user?.avatarUrl || null
            }
        }

        setInputValue('')
        setSending(true)

        // 停止输入状态
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        stopTyping(currentConversation.id)

        try {
            // 优先使用 Socket.io 发送（实时性更好）
            if (isConnected && socketSendMessage) {
                // 立即添加临时消息到本地状态（乐观更新）
                addMessage(tempMessage)

                // 通过 Socket 发送
                socketSendMessage(currentConversation.id, content)

                // 不需要等待服务器响应，因为服务器会通过广播返回确认消息
                // 临时消息会通过服务器返回的真实消息替换（或保持）
            } else {
                // 降级到 HTTP API（Socket 未连接时）
                const res = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                })

                const data = await res.json()

                // HTTP 方式需要手动更新本地状态
                if (data.data) {
                    addMessage(data.data)
                }
            }
        } catch (error) {
            console.error('发送消息失败:', error)
        } finally {
            setSending(false)
        }
    }

    /**
     * 键盘事件处理
     * Enter 发送消息，Shift+Enter 换行
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    /**
     * 格式化消息时间
     * 显示小时:分钟格式
     */
    const formatTime = (dateString: string | Date) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    /**
     * 获取会话显示名称
     * 群聊显示群名，私聊显示对方名字
     */
    const getConversationName = () => {
        if (!currentConversation) return ''

        if (currentConversation.isGroup) {
            return currentConversation.name || '群聊'
        }

        // 私聊：显示对方的名字
        const otherMember = currentConversation.members?.find(m => m.userId !== user?.id)
        return otherMember?.user?.name || '私聊'
    }

    /**
     * 获取 AI 建议
     * 将当前对话消息转换为 AI 请求格式
     */
    const fetchAISuggestionsInternal = useCallback(async () => {
        console.log('[ChatArea] fetchAISuggestions called:', {
            currentConversation: currentConversation?.id,
            user: user?.id,
            messagesKeys: Object.keys(messages),
        })

        if (!currentConversation || !user) {
            console.log('[ChatArea] Missing conversation or user')
            return
        }

        // 获取当前会话的消息
        const currentMessages = messages.get(currentConversation.id) || []
        console.log('[ChatArea] Current messages count:', currentMessages.length)

        // 至少需要 2 条消息才能生成建议
        if (currentMessages.length < 2) {
            console.log('[ChatArea] Not enough messages, need at least 2')
            return
        }

        // 转换消息格式为 AI 请求格式
        const aiMessages: AIMessageContext[] = currentMessages
            .slice(-10) // 取最近 10 条消息
            .reverse() // 按时间正序
            .map(msg => ({
                senderId: msg.senderId,
                senderName: msg.sender?.name || '用户',
                content: msg.content,
                timestamp: msg.createdAt,
                isCurrentUser: msg.senderId === user.id,
            }))

        console.log('[ChatArea] Calling fetchSuggestions with messages:', aiMessages.length)

        await fetchSuggestionsFromHook({
            messages: aiMessages,
            conversationId: currentConversation.id,
        })
    }, [currentConversation, user, messages, fetchSuggestionsFromHook])

    /**
     * 处理 AI 建议按钮点击
     * 每次点击都弹出确认对话框，用户确认后才调用 API
     */
    const handleAISuggestionClick = useCallback(() => {
        console.log('[ChatArea] handleAISuggestionClick called')
        // 每次点击都弹出确认对话框
        openPrivacyNotice()
    }, [openPrivacyNotice])

    /**
     * 处理确认（确定按钮）
     * 用户确认后才调用 API 生成建议，消耗使用次数
     */
    const handlePrivacyAccept = useCallback(() => {
        console.log('[ChatArea] handlePrivacyAccept called - user confirmed')
        closePrivacyNotice()

        // 确认后才打开建议面板并获取 AI 建议
        openSuggestionPanel()
        fetchAISuggestionsInternal()
    }, [closePrivacyNotice, openSuggestionPanel, fetchAISuggestionsInternal])

    /**
     * 处理取消（取消按钮）
     * 只关闭弹窗，不调用 API，不消耗使用次数
     * 下次点击"帮我回答"时仍然是"第一次"
     */
    const handlePrivacyDecline = useCallback(() => {
        console.log('[ChatArea] handlePrivacyDecline called - user cancelled')
        // 只关闭弹窗，不调用 API，不消耗次数
        closePrivacyNotice()
    }, [closePrivacyNotice])

    /**
     * 处理选择建议
     * 将建议内容填入输入框并关闭面板
     */
    const handleSelectSuggestion = useCallback((suggestion: { id: string; content: string }) => {
        setInputValue(suggestion.content)
        setSelectedSuggestion(suggestion.content)
        closeSuggestionPanel()
    }, [setSelectedSuggestion, closeSuggestionPanel])

    /**
     * 处理建议面板关闭
     */
    const handleCloseSuggestionPanel = useCallback(() => {
        closeSuggestionPanel()
        clearError()
    }, [closeSuggestionPanel, clearError])

    // 未选择会话时显示空状态
    if (!currentConversation) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyContent}>
                    <div className={styles.emptyIcon}>
                        💬
                    </div>
                    <h2 className={styles.emptyTitle}>选择一个会话开始聊天</h2>
                    <p className={styles.emptyText}>
                        从左侧列表选择会话，或添加好友开始新的对话
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.chatArea}>
            {/* 会话头部 */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {!sidebarOpen && (
                        <button className={styles.menuButton} onClick={toggleSidebar}>
                            <MenuIcon size={20} />
                        </button>
                    )}
                    <Avatar name={getConversationName()} size="md" />
                    <div className={styles.headerInfo}>
                        <h2 className={styles.title}>{getConversationName()}</h2>
                        <span className={styles.subtitle}>
                            {currentConversation.isGroup ? '群聊' : '私聊'}
                        </span>
                    </div>
                </div>
            </header>

            {/* 消息列表区域 */}
            <div className={styles.messages} ref={messagesContainerRef}>
                {/* 滚动锚点 - 在 column-reverse 布局中放在开头，实际显示在底部 */}
                <div ref={messagesEndRef} />
                {loading ? (
                    <div className={styles.loading}>加载中...</div>
                ) : currentMessages.length === 0 ? (
                    <div className={styles.noMessages}>
                        <p>暂无消息，发送第一条消息吧！</p>
                    </div>
                ) : (
                    // 消息列表直接渲染（数组已是倒序，配合 CSS column-reverse 显示）
                    currentMessages.map((message) => {
                        const isOwn = message.senderId === user?.id

                        return (
                            <div
                                key={message.id}
                                className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
                            >
                                {/* 对方消息显示头像 */}
                                {!isOwn && (
                                    <Avatar
                                        name={message.sender?.name || 'User'}
                                        src={message.sender?.avatarUrl || undefined}
                                        size="sm"
                                        className={styles.messageAvatar}
                                    />
                                )}
                                <div className={styles.messageContent}>
                                    <div className={styles.messageBubble}>
                                        <p className={styles.messageText}>{message.content}</p>
                                    </div>
                                    <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* 输入区域 */}
            <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    {/* AI 建议按钮 */}
                    <AISuggestionButton
                        onClick={handleAISuggestionClick}
                        disabled={!currentConversation || currentMessages.length < 2}
                        className={styles.aiButton}
                        isLoading={isAILoading}
                        remainingUsage={usageStats?.remainingUsage ?? 20}
                        error={aiError}
                    />
                    <textarea
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="输入消息... ✨"
                        className={styles.input}
                        rows={1}
                        disabled={sending}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || sending}
                        className={styles.sendButton}
                        aria-label="发送消息"
                    >
                        <SendIcon size={20} />
                    </button>
                </div>
            </div>

            {/* AI 建议面板 */}
            <AISuggestionPanel
                isOpen={isSuggestionPanelOpen}
                onClose={handleCloseSuggestionPanel}
                onUseSuggestion={handleSelectSuggestion}
                suggestions={suggestions}
                isLoading={isAILoading}
                error={aiError}
                selectedSuggestion={null}
                onSelectSuggestion={(suggestion) => {
                    setInputValue(suggestion.content)
                    closeSuggestionPanel()
                }}
                onFeedback={submitFeedback}
                onRetry={retryAI}
            />

            {/* 隐私声明弹窗 */}
            <PrivacyNotice
                isOpen={isPrivacyNoticeOpen}
                onAccept={handlePrivacyAccept}
                onDecline={handlePrivacyDecline}
            />
        </div>
    )
}
