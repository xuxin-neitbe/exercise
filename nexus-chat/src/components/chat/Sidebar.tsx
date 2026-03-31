/**
 * 侧边栏组件
 *
 * 职责：
 * - 显示用户信息和登出按钮
 * - 管理会话列表和好友列表的切换
 * - 处理好友搜索和添加
 * - 显示和处理好友请求
 *
 * 子组件：
 * - ConversationList: 会话列表
 * - FriendList: 好友列表
 */
'use client'

import { useCallback,useEffect, useState } from 'react'

import { Avatar, Button, Input,Modal } from '@/components/ui'
import { CheckIcon,ChevronDownIcon, ChevronRightIcon, LogOutIcon, MessageCircleIcon, PlusIcon, SearchIcon, UsersIcon, XIcon } from '@/components/ui/Icons'
import { type Friend, type FriendRequest,useAuthStore, useChatStore } from '@/stores'

import { ConversationList } from './ConversationList'
import { FriendList } from './FriendList'

import styles from './Sidebar.module.css'

// 标签页类型
type Tab = 'conversations' | 'friends'

interface SidebarProps {
    onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
    // 从状态管理获取数据
    const { user, setUser } = useAuthStore()
    const { friends, pendingRequests, setPendingRequests, addFriend, removePendingRequest } = useChatStore()

    // 本地状态
    const [activeTab, setActiveTab] = useState<Tab>('conversations')
    const [searchQuery, setSearchQuery] = useState('')
    const [addFriendModalOpen, setAddFriendModalOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<(Friend & {
        email?: string
        isFriend?: boolean
        hasPendingRequest?: boolean
        requestSent?: boolean
    })[]>([])
    const [searching, setSearching] = useState(false)
    const [requestsExpanded, setRequestsExpanded] = useState(true)

    // 编辑资料弹窗状态
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editAvatarUrl, setEditAvatarUrl] = useState('')
    const [profileCreatedAt, setProfileCreatedAt] = useState('')
    const [profileUpdatedAt, setProfileUpdatedAt] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [profileError, setProfileError] = useState('')

    /**
     * 格式化创建时间
     * 格式如：2024年1月1日 10:30
     */
    const formatCreatedAt = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    /**
     * 格式化最后修改时间
     * 格式如：刚刚、5分钟前、2天前、1个月前
     */
    const formatUpdatedAt = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        const now = new Date()
        const diffMs = now.getTime() - dateObj.getTime()
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)
        const diffMonth = Math.floor(diffDay / 30)
        const diffYear = Math.floor(diffDay / 365)

        if (diffSec < 60) return '刚刚'
        if (diffMin < 60) return `${diffMin}分钟前`
        if (diffHour < 24) return `${diffHour}小时前`
        if (diffDay < 30) return `${diffDay}天前`
        if (diffMonth < 12) return `${diffMonth}个月前`
        return `${diffYear}年前`
    }

    /**
     * 处理头像文件上传
     */
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingAvatar(true)
        setProfileError('')

        try {
            // 创建 FormData
            const formData = new FormData()
            formData.append('file', file)

            // 调用上传 API
            const res = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (res.ok && data.data) {
                // 更新头像 URL
                setEditAvatarUrl(data.data.url)
            } else {
                setProfileError(data.error || '上传失败')
            }
        } catch (error) {
            setProfileError('上传失败，请重试')
        } finally {
            setUploadingAvatar(false)
        }
    }

    /**
     * 获取待处理的好友请求
     * 使用 useCallback 包装以避免 useEffect 依赖问题
     */
    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await fetch('/api/friends/requests')
            const data = await res.json()
            if (data.data) {
                // 转换数据格式，添加 friendshipId
                const requests: FriendRequest[] = data.data.map((r: any) => ({
                    id: r.friend.id,
                    name: r.friend.name,
                    avatarUrl: r.friend.avatarUrl,
                    createdAt: r.friend.createdAt,
                    friendshipId: r.id
                }))
                setPendingRequests(requests)
            }
        } catch (error) {
            console.error('获取好友请求失败:', error)
        }
    }, [])

    /**
     * 切换到好友标签时加载待处理的好友请求
     */
    useEffect(() => {
        if (activeTab === 'friends') {
            fetchPendingRequests()
        }
    }, [activeTab, fetchPendingRequests])

    /**
     * 搜索用户
     * 根据用户名或邮箱搜索
     */
    const handleSearchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            setSearchResults(data.data || [])
        } catch (error) {
            console.error('搜索失败:', error)
        } finally {
            setSearching(false)
        }
    }

    /**
     * 添加好友
     * 发送好友请求（对方需要确认后才能成为好友）
     */
    const handleAddFriend = async (friendId: string) => {
        try {
            await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId })
            })
            // 只更新状态为"已发送请求"，不添加到好友列表
            setSearchResults(prev => prev.map(u =>
                u.id === friendId ? { ...u, requestSent: true } : u
            ))
        } catch (error) {
            console.error('添加好友失败:', error)
        }
    }

    /**
     * 接受好友请求
     */
    const handleAcceptRequest = async (friendshipId: string, friend: Friend) => {
        try {
            const res = await fetch('/api/friends/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipId })
            })
            if (res.ok) {
                removePendingRequest(friendshipId)
                addFriend(friend)
            }
        } catch (error) {
            console.error('接受好友请求失败:', error)
        }
    }

    /**
     * 拒绝好友请求
     */
    const handleRejectRequest = async (friendshipId: string) => {
        try {
            const res = await fetch(`/api/friends/accept?friendshipId=${friendshipId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                removePendingRequest(friendshipId)
            }
        } catch (error) {
            console.error('拒绝好友请求失败:', error)
        }
    }

    // 根据搜索词过滤好友列表
    const filteredFriends = friends.filter(f =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    /**
     * 打开编辑资料弹窗
     * 获取用户完整资料并填充表单
     */
    const handleOpenEditProfile = async () => {
        try {
            const res = await fetch('/api/users/profile')
            const data = await res.json()
            if (data.data) {
                setEditName(data.data.name || '')
                setEditEmail(data.data.email || '')
                setEditAvatarUrl(data.data.avatarUrl || '')
                setProfileCreatedAt(formatCreatedAt(data.data.createdAt))
                setProfileUpdatedAt(formatUpdatedAt(data.data.updatedAt))
                setProfileError('')
                setEditProfileModalOpen(true)
            }
        } catch (error) {
            console.error('获取用户资料失败:', error)
        }
    }

    /**
     * 保存用户资料
     * 验证表单并调用 API 更新
     */
    const handleSaveProfile = async () => {
        // 验证昵称
        if (!editName.trim()) {
            setProfileError('昵称不能为空')
            return
        }
        if (editName.length > 20) {
            setProfileError('昵称不能超过 20 个字符')
            return
        }

        // 验证邮箱
        if (!editEmail.trim()) {
            setProfileError('邮箱不能为空')
            return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(editEmail)) {
            setProfileError('邮箱格式不正确')
            return
        }

        setSavingProfile(true)
        setProfileError('')

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    email: editEmail.trim(),
                    avatarUrl: editAvatarUrl.trim() || null
                })
            })

            const data = await res.json()

            if (res.ok && data.data) {
                // 更新状态管理中的用户信息
                setUser({
                    ...user!,
                    name: data.data.name,
                    email: data.data.email,
                    image: data.data.avatarUrl
                })
                setEditProfileModalOpen(false)
            } else {
                setProfileError(data.error || '保存失败')
            }
        } catch (error) {
            setProfileError('保存失败，请重试')
        } finally {
            setSavingProfile(false)
        }
    }

    return (
        <div className={styles.sidebar}>
            {/* 用户信息头部 */}
            <div className={styles.header}>
                <div
                    className={styles.userInfo}
                    onClick={handleOpenEditProfile}
                    title="点击编辑资料"
                >
                    <Avatar name={user?.name || undefined} src={user?.image || undefined} size="md" />
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>{user?.name || '用户'}</span>
                        <span className={styles.userStatus}>在线</span>
                    </div>
                </div>
                <button className={styles.logoutButton} onClick={onLogout} title="退出登录">
                    <LogOutIcon size={18} />
                </button>
            </div>

            {/* 标签页切换 */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'conversations' ? styles.active : ''}`}
                    onClick={() => setActiveTab('conversations')}
                >
                    <MessageCircleIcon size={18} />
                    <span>消息</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''} ${activeTab !== 'friends' && pendingRequests.length > 0 ? styles.hasNotification : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    <UsersIcon size={18} />
                    <span>好友</span>
                    {/* 数字徽章：仅在不在此 tab 且有待处理请求时显示 */}
                    {activeTab !== 'friends' && pendingRequests.length > 0 && (
                        <span className={styles.tabBadge}>{pendingRequests.length}</span>
                    )}
                </button>
            </div>

            {/* 搜索框 */}
            <div className={styles.searchWrapper}>
                <div className={styles.searchBox}>
                    <SearchIcon size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={activeTab === 'conversations' ? '搜索会话...' : '搜索好友...'}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            if (activeTab === 'friends') {
                                handleSearchUsers(e.target.value)
                            }
                        }}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button className={styles.clearButton} onClick={() => setSearchQuery('')}>
                            <XIcon size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* 好友请求区域 */}
            {activeTab === 'friends' && pendingRequests.length > 0 && (
                <div className={styles.requestsSection}>
                    <div
                        className={styles.requestsHeader}
                        onClick={() => setRequestsExpanded(!requestsExpanded)}
                    >
                        <div className={styles.requestsTitle}>
                            {requestsExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                            <span>好友请求</span>
                            <span className={styles.requestBadge}>{pendingRequests.length}</span>
                        </div>
                    </div>
                    {requestsExpanded && (
                        <div className={styles.requestsList}>
                            {pendingRequests.map((request) => (
                                <div key={request.friendshipId} className={styles.requestItem}>
                                    <Avatar name={request.name || undefined} src={request.avatarUrl || undefined} size="sm" />
                                    <div className={styles.requestInfo}>
                                        <span className={styles.requestName}>{request.name || '用户'}</span>
                                    </div>
                                    <div className={styles.requestActions}>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleAcceptRequest(request.friendshipId, {
                                                id: request.id,
                                                name: request.name,
                                                avatarUrl: request.avatarUrl,
                                                createdAt: request.createdAt
                                            })}
                                        >
                                            <CheckIcon size={14} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleRejectRequest(request.friendshipId)}
                                        >
                                            <XIcon size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 内容区域：会话列表或好友列表 */}
            <div className={styles.content}>
                {activeTab === 'conversations' ? (
                    <ConversationList searchQuery={searchQuery} />
                ) : (
                    <FriendList friends={filteredFriends} searchQuery={searchQuery} />
                )}
            </div>

            {/* 添加好友按钮 */}
            {activeTab === 'friends' && (
                <div className={styles.footer}>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => setAddFriendModalOpen(true)}
                    >
                        <PlusIcon size={18} />
                        添加好友
                    </Button>
                </div>
            )}

            {/* 添加好友弹窗 */}
            <Modal
                isOpen={addFriendModalOpen}
                onClose={() => setAddFriendModalOpen(false)}
                title="添加好友"
            >
                <div className={styles.modalContent}>
                    <Input
                        placeholder="搜索用户名或邮箱..."
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        fullWidth
                    />

                    <div className={styles.searchResults}>
                        {searching ? (
                            <div className={styles.searching}>搜索中...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((result) => {
                                // 判断按钮状态
                                const isAdded = result.isFriend
                                const isSent = result.hasPendingRequest || result.requestSent

                                return (
                                    <div key={result.id} className={styles.searchResult}>
                                        <Avatar name={result.name || result.email} size="sm" />
                                        <div className={styles.resultInfo}>
                                            <span className={styles.resultName}>{result.name || result.email}</span>
                                            <span className={styles.resultId}>{result.email}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={isAdded || isSent ? 'secondary' : 'primary'}
                                            disabled={isAdded || isSent}
                                            onClick={() => handleAddFriend(result.id)}
                                        >
                                            {isAdded ? '已添加' : isSent ? '已发送' : '添加'}
                                        </Button>
                                    </div>
                                )
                            })
                        ) : searchQuery && !searching ? (
                            <div className={styles.noResults}>未找到用户</div>
                        ) : null}
                    </div>
                </div>
            </Modal>

            {/* 编辑资料弹窗 */}
            <Modal
                isOpen={editProfileModalOpen}
                onClose={() => setEditProfileModalOpen(false)}
                title="编辑资料"
            >
                <div className={styles.profileModalContent}>
                    {/* 头像预览和上传 */}
                    <div className={styles.avatarUploadSection}>
                        <div className={styles.avatarPreview}>
                            <Avatar
                                name={editName || undefined}
                                src={editAvatarUrl || undefined}
                                size="lg"
                            />
                        </div>
                        <label className={styles.uploadButton}>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                                hidden
                            />
                            {uploadingAvatar ? '上传中...' : '点击更换头像'}
                        </label>
                    </div>

                    {/* 表单字段 */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>昵称</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="请输入昵称"
                            fullWidth
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>邮箱</label>
                        <Input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="请输入邮箱"
                            fullWidth
                        />
                    </div>

                    {/* 只读字段 */}
                    <div className={styles.readOnlyGroup}>
                        <div className={styles.readOnlyItem}>
                            <span className={styles.readOnlyLabel}>创建时间</span>
                            <span className={styles.readOnlyValue}>{profileCreatedAt}</span>
                        </div>
                        <div className={styles.readOnlyItem}>
                            <span className={styles.readOnlyLabel}>最后修改</span>
                            <span className={styles.readOnlyValue}>{profileUpdatedAt}</span>
                        </div>
                    </div>

                    {/* 错误提示 */}
                    {profileError && (
                        <div className={styles.errorMessage}>{profileError}</div>
                    )}

                    {/* 按钮组 */}
                    <div className={styles.buttonGroup}>
                        <Button
                            variant="secondary"
                            onClick={() => setEditProfileModalOpen(false)}
                            disabled={savingProfile}
                        >
                            取消
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSaveProfile}
                            loading={savingProfile}
                        >
                            保存
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
