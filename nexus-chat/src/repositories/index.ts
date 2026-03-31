/**
 * 数据访问层（Repository Layer）
 *
 * 职责：
 * - 封装所有数据库操作
 * - 提供类型安全的数据访问接口
 * - 隔离业务逻辑与数据库实现细节
 *
 * 设计模式：Repository 模式
 * - 每个 Repository 对应一个数据模型
 * - 提供增删改查等基本操作
 * - 支持复杂查询和关联查询
 *
 * 优点：
 * - 数据库操作集中管理，便于维护
 * - 业务逻辑与数据访问解耦
 * - 易于单元测试和模拟
 */
import type { Conversation, ConversationMember,Friendship, Message, User } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// ==================== 类型定义 ====================

/**
 * 好友信息（包含用户详情）
 * 用于好友列表展示，关联查询好友的用户信息
 */
export type FriendWithUser = Friendship & {
  friend: Pick<User, 'id' | 'name' | 'avatarUrl' | 'createdAt'>
}

/**
 * 会话信息（包含成员和最后消息）
 * 用于会话列表展示，包含会话成员和最近一条消息
 */
export type ConversationWithMembers = Conversation & {
  members: (ConversationMember & {
    user: Pick<User, 'id' | 'name' | 'avatarUrl'>
  })[]
  messages: Pick<Message, 'id' | 'content' | 'createdAt' | 'senderId'>[]
}

/**
 * 消息信息（包含发送者）
 * 用于消息列表展示，包含发送者的基本信息
 */
export type MessageWithSender = Message & {
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

// ==================== 用户仓库 ====================

/**
 * 用户数据仓库
 *
 * 提供用户相关的数据库操作：
 * - 基础 CRUD：创建、查询、更新
 * - 批量查询：按 ID 列表查询
 * - 搜索功能：按邮箱或用户名搜索，并标记好友关系
 */
export class UserRepository {
  /**
   * 根据用户 ID 获取用户信息
   */
  async getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    })
  }

  /**
   * 根据邮箱获取用户信息
   * 用于登录验证和注册检查
   */
  async getByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    })
  }

  /**
   * 批量获取用户信息
   * 用于群聊成员列表等场景
   */
  async getByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return []
    return prisma.user.findMany({
      where: { id: { in: ids } }
    })
  }

  /**
   * 创建新用户
   * 密码应在传入前进行加密
   */
  async create(data: { id?: string; email: string; name?: string; password?: string }): Promise<User> {
    return prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        password: data.password
      } as any
    })
  }

  /**
   * 更新用户信息
   * 仅支持更新昵称和头像
   */
  async update(id: string, data: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    })
  }

  /**
   * 搜索用户
   *
   * 功能：
   * - 按邮箱或用户名模糊搜索（不区分大小写）
   * - 排除当前用户
   * - 标记搜索结果是否已是好友
   * - 标记是否已发送好友请求
   *
   * @param query 搜索关键词
   * @param currentUserId 当前用户 ID
   * @param limit 返回结果数量限制
   */
  async search(query: string, currentUserId: string, limit = 10): Promise<(User & { isFriend: boolean; hasPendingRequest: boolean })[]> {
    // 搜索匹配的用户（排除自己）
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      take: limit
    })

    // 查询当前用户的好友关系（已接受）
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUserId },
          { friendId: currentUserId }
        ],
        status: 'accepted'
      },
      select: { userId: true, friendId: true }
    })

    // 构建好友 ID 集合
    const friendIds = new Set<string>()
    friendships.forEach(f => {
      if (f.userId !== currentUserId) friendIds.add(f.userId)
      if (f.friendId !== currentUserId) friendIds.add(f.friendId)
    })

    // 查询已发送的待处理请求
    const sentRequests = await prisma.friendship.findMany({
      where: {
        userId: currentUserId,
        status: 'pending'
      },
      select: { friendId: true }
    })
    const sentRequestIds = new Set(sentRequests.map(r => r.friendId))

    // 为每个用户添加 isFriend 和 hasPendingRequest 标记
    return users.map(user => ({
      ...user,
      isFriend: friendIds.has(user.id),
      hasPendingRequest: sentRequestIds.has(user.id)
    }))
  }
}

// ==================== 好友关系仓库 ====================

/**
 * 好友关系数据仓库
 *
 * 提供好友关系相关的数据库操作：
 * - 获取好友列表
 * - 管理好友请求（获取、接受、拒绝）
 * - 添加/删除好友
 * - 检查好友关系
 *
 * 数据模型说明：
 * - Friendship 表存储好友关系，包含 userId 和 friendId
 * - 接受好友请求时会创建双向关系（A→B 和 B→A）
 * - 这样可以快速查询双方的好友列表
 */
export class FriendshipRepository {
  /**
   * 获取用户的好友列表
   *
   * 只查询当前用户发起的好友关系（userId = 当前用户）
   * 因为接受好友请求时会创建双向关系，所以只需查单向
   */
  async getFriends(userId: string): Promise<FriendWithUser[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        userId,
        status: 'accepted'
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return friendships as FriendWithUser[]
  }

  /**
   * 获取待处理的好友请求
   *
   * 查询发送给当前用户的好友请求（friendId = 当前用户）
   * 需要关联 user 表获取发起者的信息
   */
  async getPendingRequests(userId: string): Promise<FriendWithUser[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 将 user 字段映射为 friend 字段，保持返回类型一致
    return friendships.map(f => ({
      ...f,
      friend: f.user
    })) as FriendWithUser[]
  }

  /**
   * 添加好友（直接成为好友，无需确认）
   *
   * 创建双向好友关系：
   * 1. 检查是否已存在好友关系
   * 2. 创建 pending 状态的请求记录
   */
  async addFriend(userId: string, friendId: string): Promise<Friendship> {
    // 检查是否已存在好友关系（双向检查）
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    })

    if (existing) {
      throw new Error('好友关系已存在')
    }

    // 创建 pending 状态的好友请求（单向）
    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'pending'
      }
    })

    return friendship
  }

  /**
   * 接受好友请求
   *
   * 流程：
   * 1. 验证好友请求存在且状态为 pending
   * 2. 更新请求状态为 accepted
   * 3. 创建反向好友关系
   *
   * 返回：好友请求发起者的 ID（用于通知）
   */
  async acceptFriend(friendshipId: string, userId: string): Promise<string> {
    // 验证好友请求
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        friendId: userId,
        status: 'pending'
      }
    })

    if (!friendship) {
      throw new Error('好友请求不存在')
    }

    // 更新原请求状态
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' }
    })

    // 创建反向好友关系
    await prisma.friendship.create({
      data: {
        userId,
        friendId: friendship.userId,
        status: 'accepted'
      }
    })

    // 返回好友请求发起者的 ID
    return friendship.userId
  }

  /**
   * 删除好友
   *
   * 删除双向好友关系
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    })
  }

  /**
   * 检查是否是好友
   */
  async isFriend(userId: string, friendId: string): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' }
        ]
      }
    })

    return !!friendship
  }

  /**
   * 拒绝好友请求
   *
   * 直接删除待处理的请求记录
   */
  async rejectFriend(friendshipId: string, userId: string): Promise<void> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        friendId: userId,
        status: 'pending'
      }
    })

    if (!friendship) {
      throw new Error('好友请求不存在')
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    })
  }
}

// ==================== 会话仓库 ====================

/**
 * 会话数据仓库
 *
 * 提供会话相关的数据库操作：
 * - 会话的创建和查询
 * - 私聊会话的查找
 * - 用户会话列表
 */
export class ConversationRepository {
  /**
   * 根据会话 ID 获取会话基本信息
   */
  async getById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({
      where: { id }
    })
  }

  /**
   * 获取会话详情（包含成员和最后一条消息）
   */
  async getByIdWithDetails(id: string): Promise<ConversationWithMembers | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  /**
   * 查找两个用户之间的私聊会话
   *
   * 查询条件：
   * - 非群聊（isGroup = false）
   * - 成员恰好是这两个用户
   */
  async getPrivateConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    const conversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [userId1, userId2] }
          }
        }
      },
      include: {
        members: true
      }
    })

    const privateConversation = conversations.find(c => c.members.length === 2)
    return privateConversation || null
  }

  /**
   * 获取用户的所有会话列表
   *
   * 按更新时间倒序排列，包含成员信息和最后一条消息
   */
  async listByUser(userId: string): Promise<ConversationWithMembers[]> {
    return prisma.conversation.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * 创建新会话
   *
   * 注意：创建后需要单独添加成员
   */
  async create(data: { isGroup?: boolean; name?: string; creatorId: string }): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        isGroup: data.isGroup || false,
        name: data.name
      }
    })
  }

  /**
   * 更新会话信息
   */
  async update(id: string, data: Partial<Pick<Conversation, 'name'>>): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data
    })
  }
}

// ==================== 会话成员仓库 ====================

/**
 * 会话成员数据仓库
 *
 * 提供会话成员相关的数据库操作：
 * - 成员的添加和移除
 * - 成员权限验证
 * - 批量成员操作
 */
export class ConversationMemberRepository {
  /**
   * 获取用户在指定会话中的成员信息
   */
  async getByUserAndConversation(userId: string, conversationId: string): Promise<ConversationMember | null> {
    return prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    })
  }

  /**
   * 获取会话的所有成员
   * 按加入时间排序
   */
  async getByConversation(conversationId: string): Promise<ConversationMember[]> {
    return prisma.conversationMember.findMany({
      where: { conversationId },
      orderBy: { joinedAt: 'asc' }
    })
  }

  /**
   * 添加单个成员到会话
   */
  async add(userId: string, conversationId: string): Promise<ConversationMember> {
    return prisma.conversationMember.create({
      data: {
        userId,
        conversationId
      }
    })
  }

  /**
   * 批量添加成员到会话
   *
   * @returns 实际添加的成员数量
   */
  async addMany(userIds: string[], conversationId: string): Promise<number> {
    const result = await prisma.conversationMember.createMany({
      data: userIds.map(userId => ({
        userId,
        conversationId
      })),
      skipDuplicates: true
    })

    return result.count
  }

  /**
   * 从会话中移除成员
   */
  async remove(userId: string, conversationId: string): Promise<void> {
    await prisma.conversationMember.delete({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    })
  }

  /**
   * 检查用户是否是会话成员
   * 用于权限验证
   */
  async isMember(userId: string, conversationId: string): Promise<boolean> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    })

    return !!member
  }
}

// ==================== 消息仓库 ====================

/**
 * 消息数据仓库
 *
 * 提供消息相关的数据库操作：
 * - 消息的创建、查询、删除
 * - 分页加载历史消息
 * - 自动更新会话时间戳
 */
export class MessageRepository {
  /**
   * 根据消息 ID 获取消息基本信息
   */
  async getById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id }
    })
  }

  /**
   * 获取消息详情（包含发送者信息）
   */
  async getByIdWithSender(id: string): Promise<MessageWithSender | null> {
    return prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    })
  }

  /**
   * 获取会话的消息列表（分页）
   *
   * 参数：
   * - conversationId: 会话 ID
   * - limit: 返回消息数量，默认 50
   * - before: 加载此消息 ID 之前的消息（用于向上滚动加载更多）
   * - beforeCreatedAt: 可选，前端传递的 before 消息的创建时间，避免额外查询
   *
   * 返回结果按时间倒序，前端需要 reverse() 后显示
   */
  async getByConversation(
    conversationId: string,
    options?: { limit?: number; before?: string; beforeCreatedAt?: Date }
  ): Promise<MessageWithSender[]> {
    const { limit = 50, before, beforeCreatedAt } = options || {}

    // 优化：如果前端传递了 beforeCreatedAt，直接使用，避免额外查询
    let whereClause: { conversationId: string; createdAt?: { lt: Date } } = { conversationId }

    if (before && beforeCreatedAt) {
      whereClause = {
        conversationId,
        createdAt: { lt: beforeCreatedAt }
      }
    } else if (before) {
      // 兼容旧调用方式：查询 before 消息的创建时间
      const beforeMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true }
      })
      if (beforeMessage) {
        whereClause = {
          conversationId,
          createdAt: { lt: beforeMessage.createdAt }
        }
      }
    }

    return prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * 创建新消息
   *
   * 同时更新会话的 updatedAt 字段，用于会话列表排序
   */
  async create(data: { content: string; conversationId: string; senderId: string }): Promise<MessageWithSender> {
    // 创建消息
    const message = await prisma.message.create({
      data: {
        content: data.content,
        conversationId: data.conversationId,
        senderId: data.senderId
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    })

    // 更新会话的最后更新时间（用于会话列表排序）
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() }
    })

    return message
  }

  /**
   * 删除消息
   */
  async delete(id: string): Promise<void> {
    await prisma.message.delete({
      where: { id }
    })
  }
}

// ==================== 导出仓库实例 ====================

// 导出单例实例，供 Service 层使用
export const userRepo = new UserRepository()
export const friendshipRepo = new FriendshipRepository()
export const conversationRepo = new ConversationRepository()
export const conversationMemberRepo = new ConversationMemberRepository()
export const messageRepo = new MessageRepository()
