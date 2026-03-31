/**
 * 会话列表组件
 *
 * 职责：
 * - 显示用户的会话列表
 * - 支持搜索过滤
 * - 显示每个会话的最后一条消息预览
 * - 处理会话切换
 */
'use client'

import type { Conversation } from '@prisma/client'

import { Avatar } from '@/components/ui'
import { useAuthStore,useChatStore } from '@/stores'

import styles from './ConversationList.module.css'

interface ConversationListProps {
    searchQuery: string
}

export function ConversationList({ searchQuery }: ConversationListProps) {
    // 从状态管理获取会话数据和当前用户信息
    const { conversations, currentConversation, setCurrentConversation, messages } = useChatStore()
    const { user } = useAuthStore()

    // 根据搜索词过滤会话
    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true
        return conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    /**
     * 获取会话的最后一条消息
     */
    const getLastMessage = (conversationId: string) => {
        const conversationMessages = messages.get(conversationId)
        if (!conversationMessages || conversationMessages.length === 0) return null
        return conversationMessages[0]
    }

    /**
     * 格式化消息时间
     * - 今天：显示时间
     * - 昨天：显示"昨天"
     * - 一周内：显示"X天前"
     * - 更早：显示日期
     */
    const formatTime = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const diff = now.getTime() - dateObj.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) {
            return dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        } if (days === 1) {
            return '昨天'
        } if (days < 7) {
            return `${days}天前`
        }
            return dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

    }

    /**
     * 获取会话显示名称
     * - 群聊：使用会话名称
     * - 私聊：从 members 中找到对方用户的名字显示
     */
    const getConversationName = (conversation: any) => {
        if (conversation.isGroup) {
            return conversation.name || '群聊'
        }

        // 私聊会话：从 members 中找到不是当前用户的那个用户
        if (conversation.members && conversation.members.length > 0) {
            const otherMember = conversation.members.find((m: any) => m.userId !== user?.id)
            if (otherMember?.user?.name) {
                return otherMember.user.name
            }
            if (otherMember?.user) {
                return '用户'
            }
        }

        return conversation.name || '私聊'
    }

    // 空状态
    if (filteredConversations.length === 0) {
        return (
            <div className={styles.empty}>
                <p className={styles.emptyText}>
                    {searchQuery ? '没有找到会话' : '暂无会话，开始聊天吧！'}
                </p>
            </div>
        )
    }

    return (
        <div className={styles.list}>
            {filteredConversations.map((conversation) => {
                const lastMessage = getLastMessage(conversation.id)
                const isActive = currentConversation?.id === conversation.id

                return (
                    <div
                        key={conversation.id}
                        className={`${styles.item} ${isActive ? styles.active : ''}`}
                        onClick={() => setCurrentConversation(conversation)}
                    >
                        <Avatar
                            name={getConversationName(conversation)}
                            size="md"
                        />
                        <div className={styles.content}>
                            <div className={styles.header}>
                                <span className={styles.name}>{getConversationName(conversation)}</span>
                                {lastMessage && (
                                    <span className={styles.time}>{formatTime(lastMessage.createdAt)}</span>
                                )}
                            </div>
                            {lastMessage && (
                                <p className={styles.preview}>
                                    {lastMessage.content.slice(0, 50)}
                                    {lastMessage.content.length > 50 ? '...' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
