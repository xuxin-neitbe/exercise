/**
 * 好友列表组件
 *
 * 职责：
 * - 显示用户的好友列表
 * - 支持与好友发起私聊
 * - 创建或获取与好友的私聊会话
 */
'use client'

import { Avatar, Button } from '@/components/ui'
import { useChatStore } from '@/stores'

import styles from './FriendList.module.css'

interface Friend {
    id: string
    name: string | null
    avatarUrl: string | null
    createdAt: Date
}

interface FriendItemProps {
    friend: Friend
}

export function FriendList({ friends, searchQuery }: { friends: Friend[], searchQuery: string }) {
    // 从状态管理获取会话相关方法和在线用户状态
    const { setCurrentConversation, conversations, setConversations, onlineUsers } = useChatStore()

    /**
     * 与好友发起聊天
     * 如果已有私聊会话则切换到该会话，否则创建新会话
     */
    const handleStartChat = async (friendId: string) => {
        try {
            // 调用 API 创建或获取私聊会话
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isGroup: false,
                    memberIds: [friendId]
                })
            })

            const data = await res.json()

            if (data.data) {
                // 检查会话是否已存在于列表中
                const exists = conversations.find(c => c.id === data.data.id)
                if (!exists) {
                    // 新会话添加到列表顶部
                    setConversations([data.data, ...conversations])
                }
                // 切换到该会话
                setCurrentConversation(data.data)
            }
        } catch (error) {
            console.error('创建会话失败:', error)
        }
    }

    // 空状态
    if (friends.length === 0) {
        return (
            <div className={styles.empty}>
                <p className={styles.emptyText}>
                    {searchQuery ? '没有找到好友' : '暂无好友，添加一个吧！'}
                </p>
            </div>
        )
    }

    return (
        <div className={styles.list}>
            {friends.map((friend) => (
                <div key={friend.id} className={styles.item}>
                    <Avatar
                        name={friend.name}
                        src={friend.avatarUrl}
                        size="md"
                    />
                    <div className={styles.info}>
                        <span className={styles.name}>{friend.name || '用户'}</span>
                        <span className={`${styles.status} ${onlineUsers.has(friend.id) ? styles.online : styles.offline}`}>
                            {onlineUsers.has(friend.id) ? '在线' : '离线'}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartChat(friend.id)}
                    >
                        发消息
                    </Button>
                </div>
            ))}
        </div>
    )
}
