/**
 * 业务逻辑层（Service Layer）
 *
 * 职责：
 * - 封装业务规则和业务流程
 * - 协调多个 Repository 完成复杂操作
 * - 处理业务异常和错误
 * - 提供事务性操作
 *
 * 设计原则：
 * - Service 不涉及 HTTP 请求/响应（由 API Route 处理）
 * - Service 方法应该是纯业务逻辑
 * - Service 可以调用多个 Repository
 * - Service 层抛出的异常应该有明确的业务含义
 *
 * 与 Repository 的区别：
 * - Repository：纯数据访问，不包含业务逻辑
 * - Service：业务逻辑，可以调用多个 Repository
 */
import type { Conversation, ConversationMember,Friendship, Message, User } from '@prisma/client'

import {
  conversationMemberRepo,
  conversationRepo,
  type ConversationWithMembers,
  friendshipRepo,
  type FriendWithUser,
  messageRepo,
  type MessageWithSender,
  userRepo} from '@/repositories'

// ==================== 用户服务 ====================

/**
 * 用户业务服务
 *
 * 提供用户相关的业务逻辑：
 * - 用户信息的获取和更新
 * - 用户注册（包含邮箱唯一性校验）
 * - 用户搜索
 */
export class UserService {
  /**
   * 根据用户 ID 获取用户信息
   */
  async getUser(id: string): Promise<User | null> {
    return userRepo.getById(id)
  }

  /**
   * 根据邮箱获取用户信息
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return userRepo.getByEmail(email)
  }

  /**
   * 批量获取用户信息
   */
  async getUsersByIds(ids: string[]): Promise<User[]> {
    return userRepo.getByIds(ids)
  }

  /**
   * 创建新用户
   *
   * 业务规则：
   * - 邮箱必须唯一
   * - 密码应在传入前加密
   */
  async createUser(data: { email: string; name?: string; password?: string }): Promise<User> {
    // 检查邮箱是否已被注册
    const existingUser = await userRepo.getByEmail(data.email)
    if (existingUser) {
      throw new Error('邮箱已被注册')
    }
    return userRepo.create(data)
  }

  /**
   * 更新用户资料
   */
  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<User> {
    return userRepo.update(userId, data)
  }

  /**
   * 搜索用户
   *
   * 业务规则：
   * - 空查询返回空结果
   * - 排除当前用户
   * - 标记是否已是好友
   * - 标记是否已发送好友请求
   */
  async searchUsers(query: string, currentUserId: string): Promise<(User & { isFriend: boolean; hasPendingRequest: boolean })[]> {
    if (!query.trim()) return []
    return userRepo.search(query.trim(), currentUserId)
  }
}

// ==================== 好友服务 ====================

/**
 * 好友关系业务服务
 *
 * 提供好友关系相关的业务逻辑：
 * - 好友列表管理
 * - 好友请求处理
 * - 好友关系验证
 */
export class FriendshipService {
  /**
   * 获取用户的好友列表
   */
  async getFriends(userId: string): Promise<FriendWithUser[]> {
    return friendshipRepo.getFriends(userId)
  }

  /**
   * 获取待处理的好友请求
   */
  async getPendingRequests(userId: string): Promise<FriendWithUser[]> {
    return friendshipRepo.getPendingRequests(userId)
  }

  /**
   * 添加好友
   *
   * 业务规则：
   * - 不能添加自己为好友
   * - 不能重复添加已是好友的用户
   */
  async addFriend(userId: string, friendId: string): Promise<Friendship> {
    // 不能添加自己为好友
    if (userId === friendId) {
      throw new Error('不能添加自己为好友')
    }

    // 检查是否已经是好友
    const isFriend = await friendshipRepo.isFriend(userId, friendId)
    if (isFriend) {
      throw new Error('已经是好友了')
    }

    return friendshipRepo.addFriend(userId, friendId)
  }

  /**
   * 接受好友请求
   * 返回好友请求发起者的 ID（用于通知）
   */
  async acceptFriend(friendshipId: string, userId: string): Promise<string> {
    return friendshipRepo.acceptFriend(friendshipId, userId)
  }

  /**
   * 删除好友
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    return friendshipRepo.removeFriend(userId, friendId)
  }

  /**
   * 检查是否是好友
   */
  async isFriend(userId: string, friendId: string): Promise<boolean> {
    return friendshipRepo.isFriend(userId, friendId)
  }

  /**
   * 拒绝好友请求
   */
  async rejectFriend(friendshipId: string, userId: string): Promise<void> {
    return friendshipRepo.rejectFriend(friendshipId, userId)
  }
}

// ==================== 消息服务 ====================

/**
 * 消息业务服务
 *
 * 提供消息相关的业务逻辑：
 * - 发送消息（包含权限验证）
 * - 获取消息列表
 * - 消息管理
 */
export class MessageService {
  /**
   * 发送消息
   *
   * 业务规则：
   * - 只有会话成员才能发送消息
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<MessageWithSender> {
    // 验证发送者是否是会话成员
    const isMember = await conversationMemberRepo.isMember(senderId, conversationId)
    if (!isMember) {
      throw new Error('您不是该会话的成员')
    }

    return messageRepo.create({
      content,
      conversationId,
      senderId
    })
  }

  /**
   * 获取会话的消息列表
   * 支持分页加载
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string }
  ): Promise<MessageWithSender[]> {
    return messageRepo.getByConversation(conversationId, options)
  }

  /**
   * 获取单条消息
   */
  async getMessage(id: string): Promise<Message | null> {
    return messageRepo.getById(id)
  }

  /**
   * 获取消息详情（包含发送者信息）
   */
  async getMessageWithSender(id: string): Promise<MessageWithSender | null> {
    return messageRepo.getByIdWithSender(id)
  }

  /**
   * 删除消息
   */
  async deleteMessage(id: string): Promise<void> {
    return messageRepo.delete(id)
  }
}

// ==================== 会话服务 ====================

/**
 * 会话业务服务
 *
 * 提供会话相关的业务逻辑：
 * - 会话的创建和管理
 * - 私聊和群聊的创建
 * - 成员管理
 */
export class ConversationService {
  /**
   * 获取会话基本信息
   */
  async getConversation(id: string): Promise<Conversation | null> {
    return conversationRepo.getById(id)
  }

  /**
   * 获取会话详情（包含成员和消息）
   */
  async getConversationWithDetails(id: string): Promise<ConversationWithMembers | null> {
    return conversationRepo.getByIdWithDetails(id)
  }

  /**
   * 查找两个用户之间的私聊会话
   */
  async getPrivateConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    return conversationRepo.getPrivateConversation(userId1, userId2)
  }

  /**
   * 获取用户的所有会话列表
   */
  async listUserConversations(userId: string): Promise<ConversationWithMembers[]> {
    return conversationRepo.listByUser(userId)
  }

  /**
   * 创建私聊会话
   *
   * 业务规则：
   * - 如果已存在私聊会话，直接返回现有会话
   * - 否则创建新会话并添加双方为成员
   */
  async createPrivateConversation(userId1: string, userId2: string): Promise<Conversation> {
    // 检查是否已存在私聊会话（避免重复创建）
    const existing = await conversationRepo.getPrivateConversation(userId1, userId2)
    if (existing) {
      return existing
    }

    // 创建新会话
    const conversation = await conversationRepo.create({
      isGroup: false,
      creatorId: userId1
    })

    // 添加双方为会话成员
    await conversationMemberRepo.addMany([userId1, userId2], conversation.id)

    return conversation
  }

  /**
   * 创建群聊会话
   *
   * 业务规则：
   * - 创建者自动成为成员
   * - 成员列表去重
   */
  async createGroupConversation(
    creatorId: string,
    name: string,
    memberIds: string[]
  ): Promise<Conversation> {
    // 创建群聊会话
    const conversation = await conversationRepo.create({
      isGroup: true,
      name,
      creatorId
    })

    // 添加所有成员（包括创建者，使用 Set 去重）
    const allMemberIds = [...new Set([creatorId, ...memberIds])]
    await conversationMemberRepo.addMany(allMemberIds, conversation.id)

    return conversation
  }

  /**
   * 获取会话的所有成员
   */
  async getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
    return conversationMemberRepo.getByConversation(conversationId)
  }

  /**
   * 添加成员到会话
   *
   * 业务规则：
   * - 不能重复添加已是成员的用户
   */
  async addMember(conversationId: string, userId: string): Promise<ConversationMember> {
    // 检查是否已是成员
    const isMember = await conversationMemberRepo.isMember(userId, conversationId)
    if (isMember) {
      throw new Error('用户已是会话成员')
    }

    return conversationMemberRepo.add(userId, conversationId)
  }

  /**
   * 从会话中移除成员
   */
  async removeMember(conversationId: string, userId: string): Promise<void> {
    return conversationMemberRepo.remove(userId, conversationId)
  }

  /**
   * 检查用户是否是会话成员
   */
  async isMember(userId: string, conversationId: string): Promise<boolean> {
    return conversationMemberRepo.isMember(userId, conversationId)
  }
}

// ==================== 导出服务实例 ====================

// 导出单例实例，供 API Route 使用
export const userService = new UserService()
export const friendshipService = new FriendshipService()
export const messageService = new MessageService()
export const conversationService = new ConversationService()
