import { FriendshipService } from '@/services'

// Mock repositories
jest.mock('@/repositories', () => ({
  friendshipRepo: {
    getFriends: jest.fn(),
    getPendingRequests: jest.fn(),
    addFriend: jest.fn(),
    acceptFriend: jest.fn(),
    removeFriend: jest.fn(),
    isFriend: jest.fn(),
    rejectFriend: jest.fn(),
  },
  userRepo: {
    search: jest.fn(),
  },
}))

import { friendshipRepo } from '@/repositories'

const mockFriendshipRepo = friendshipRepo as jest.Mocked<typeof friendshipRepo>

describe('好友服务测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFriends', () => {
    it('应该返回好友列表', async () => {
      const mockFriends = [
        {
          id: 'friend-1',
          userId: 'user-1',
          friendId: 'user-2',
          status: 'accepted',
          friend: {
            id: 'user-2',
            name: 'Alice',
            avatarUrl: null,
          },
        },
      ]

      mockFriendshipRepo.getFriends.mockResolvedValue(mockFriends as any)

      const service = new FriendshipService()
      const friends = await service.getFriends('user-1')

      expect(friends).toHaveLength(1)
      expect(friends[0].friend.name).toBe('Alice')
    })

    it('没有好友时应该返回空数组', async () => {
      mockFriendshipRepo.getFriends.mockResolvedValue([])

      const service = new FriendshipService()
      const friends = await service.getFriends('user-1')

      expect(friends).toHaveLength(0)
    })
  })

  describe('getPendingRequests', () => {
    it('应该返回待处理的请求', async () => {
      const mockRequests = [
        {
          id: 'friendship-1',
          userId: 'user-2',
          friendId: 'user-1',
          status: 'pending',
          user: {
            id: 'user-2',
            name: 'Bob',
            avatarUrl: null,
          },
        },
      ]

      mockFriendshipRepo.getPendingRequests.mockResolvedValue(mockRequests as any)

      const service = new FriendshipService()
      const requests = await service.getPendingRequests('user-1')

      expect(requests).toHaveLength(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((requests[0] as any).user.name).toBe('Bob')
    })
  })

  describe('addFriend', () => {
    it('应该创建待处理的好友请求', async () => {
      mockFriendshipRepo.addFriend.mockResolvedValue({
        id: 'friendship-1',
        userId: 'user-1',
        friendId: 'user-2',
        status: 'pending',
      } as any)

      const service = new FriendshipService()
      const result = await service.addFriend('user-1', 'user-2')

      expect(result).toBeDefined()
      expect(mockFriendshipRepo.addFriend).toHaveBeenCalledWith('user-1', 'user-2')
    })

    it('不能添加自己为好友', async () => {
      const service = new FriendshipService()
      await expect(
        service.addFriend('user-1', 'user-1')
      ).rejects.toThrow('不能添加自己为好友')
    })

    it('已有好友关系时应该抛出错误', async () => {
      mockFriendshipRepo.isFriend.mockResolvedValue(true)

      const service = new FriendshipService()
      await expect(
        service.addFriend('user-1', 'user-2')
      ).rejects.toThrow('已经是好友了')
    })
  })

  describe('acceptFriend', () => {
    it('应该更新好友状态为已接受', async () => {
      mockFriendshipRepo.acceptFriend.mockResolvedValue()

      const service = new FriendshipService()
      await service.acceptFriend('friendship-1', 'user-1')

      expect(mockFriendshipRepo.acceptFriend).toHaveBeenCalledWith('friendship-1', 'user-1')
    })
  })

  describe('removeFriend', () => {
    it('应该删除好友关系', async () => {
      mockFriendshipRepo.removeFriend.mockResolvedValue()

      const service = new FriendshipService()
      await service.removeFriend('user-1', 'user-2')

      expect(mockFriendshipRepo.removeFriend).toHaveBeenCalledWith('user-1', 'user-2')
    })
  })
})
