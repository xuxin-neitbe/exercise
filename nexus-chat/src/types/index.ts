// 从 Prisma 导出类型
export type {
  Account,
  Conversation,
  ConversationMember,
  Friendship,
  Message,
  Session,
  User,
  VerificationToken
} from '@prisma/client'

// 额外的组合类型
export interface ConversationWithMembers {
  id: string
  name: string | null
  isGroup: boolean
  createdAt: Date
  updatedAt: Date
  members: {
    userId: string
    joinedAt: Date
    user: {
      id: string
      name: string | null
      avatarUrl: string | null
    }
  }[]
  messages: {
    id: string
    content: string
    createdAt: Date
    senderId: string
  }[]
}

export interface MessageWithSender {
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

export interface FriendWithUser {
  id: string
  userId: string
  friendId: string
  status: string
  createdAt: Date
  friend: {
    id: string
    name: string | null
    avatarUrl: string | null
    createdAt: Date
  }
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
