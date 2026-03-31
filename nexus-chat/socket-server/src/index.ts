/**
 * Socket.io 实时通信服务器
 *
 * 职责：
 * - 处理 WebSocket 连接和认证
 * - 实现消息实时推送
 * - 管理用户在线状态
 * - 处理好友请求和通知
 *
 * 主要功能：
 * 1. 会话管理：加入/离开会话房间
 * 2. 消息发送：实时消息推送
 * 3. 输入状态：显示用户正在输入
 * 4. 好友系统：好友请求和接受
 * 5. 在线状态：用户上线/下线通知
 *
 * 房间机制：
 * - user:{userId}: 用户个人房间，用于私聊和通知
 * - conversation:{conversationId}: 会话房间，用于群聊
 *
 * 安全措施：
 * - JWT token 验证：连接时验证 token 有效性
 * - userId 与 token 绑定：防止 token 盗用
 */
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

// 加载环境变量
dotenv.config();

// JWT 密钥 - 安全检查：必须配置环境变量
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) {
  console.error('❌ 致命错误: NEXTAUTH_SECRET 环境变量未配置');
  console.error('请在 .env 文件中设置 NEXTAUTH_SECRET');
  process.exit(1);
}

// 初始化 Prisma 客户端
const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// CORS 配置 - 允许前端跨域访问
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// 初始化 Socket.io 服务器
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Express 中间件配置
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

/**
 * 健康检查端点
 * 用于监控服务状态
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 内部消息广播端点
 * 供 Next.js API 调用，用于 HTTP 方式发送消息后触发 Socket 广播
 *
 * 安全措施：
 * - 验证内部 API 密钥（INTERNAL_API_KEY）
 * - 或验证请求来源 IP 为本地地址
 *
 * 请求体：
 * - conversationId: 会话 ID
 * - message: 消息对象（包含 id, senderId, content, createdAt, sender 等）
 * - Headers: X-Internal-API-Key: <INTERNAL_API_KEY>
 */
app.post('/internal/broadcast-message', async (req, res) => {
  try {
    // 安全验证：检查内部 API 密钥或本地 IP
    const internalApiKey = process.env.INTERNAL_API_KEY;
    const requestApiKey = req.headers['x-internal-api-key'];
    const clientIP = req.ip || req.socket.remoteAddress || '';

    // 允许本地请求（开发环境）或正确的 API 密钥
    const isLocalRequest = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1' || clientIP.startsWith('::ffff:172.') || clientIP.startsWith('172.');
    const isValidApiKey = internalApiKey && requestApiKey === internalApiKey;

    if (!isLocalRequest && !isValidApiKey) {
      console.warn(`[Security] 未授权的内部 API 访问尝试，IP: ${clientIP}`);
      return res.status(403).json({ error: '未授权访问' });
    }

    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 广播消息到会话房间
    io.to(`conversation:${conversationId}`).emit('new-message', message);

    // 获取会话所有成员，通知他们有新消息（用于更新会话列表）
    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true }
    });

    members.forEach(({ userId: memberId }) => {
      io.to(`user:${memberId}`).emit('conversation-updated', {
        conversationId,
        lastMessage: message
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({ error: '广播消息失败' });
  }
});

/**
 * 内部好友请求广播端点
 * 供 Next.js API 调用，用于 HTTP 方式发送好友请求后触发 Socket 广播
 *
 * 请求体：
 * - friendshipId: 好友关系 ID
 * - userId: 发送者 ID
 * - friendId: 接收者 ID
 * - user: 发送者信息（id, name, avatarUrl）
 */
app.post('/internal/friend-request', async (req, res) => {
  try {
    // 安全验证：检查内部 API 密钥或本地 IP
    const internalApiKey = process.env.INTERNAL_API_KEY;
    const requestApiKey = req.headers['x-internal-api-key'];
    const clientIP = req.ip || req.socket.remoteAddress || '';

    const isLocalRequest = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    const isValidApiKey = internalApiKey && requestApiKey === internalApiKey;

    if (!isLocalRequest && !isValidApiKey) {
      console.warn(`[Security] 未授权的内部 API 访问尝试，IP: ${clientIP}`);
      return res.status(403).json({ error: '未授权访问' });
    }

    const { friendshipId, friendId, user } = req.body;

    if (!friendshipId || !friendId || !user) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 广播好友请求给目标用户
    io.to(`user:${friendId}`).emit('friend-request-received', {
      id: friendshipId,
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      createdAt: new Date()
    });

    console.log(`[Internal] 好友请求已广播: ${user.id} -> ${friendId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Friend request broadcast error:', error);
    res.status(500).json({ error: '广播好友请求失败' });
  }
});

/**
 * 内部好友接受广播端点
 * 供 Next.js API 调用，用于 HTTP 方式接受好友请求后触发 Socket 广播
 *
 * 请求体：
 * - friendshipId: 好友关系 ID
 * - userId: 接受者 ID
 * - friendId: 发送者 ID（原请求发起者）
 * - friend: 接受者信息（id, name, avatarUrl）
 */
app.post('/internal/friend-accepted', async (req, res) => {
  try {
    // 安全验证：检查内部 API 密钥或本地 IP
    const internalApiKey = process.env.INTERNAL_API_KEY;
    const requestApiKey = req.headers['x-internal-api-key'];
    const clientIP = req.ip || req.socket.remoteAddress || '';

    const isLocalRequest = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    const isValidApiKey = internalApiKey && requestApiKey === internalApiKey;

    if (!isLocalRequest && !isValidApiKey) {
      console.warn(`[Security] 未授权的内部 API 访问尝试，IP: ${clientIP}`);
      return res.status(403).json({ error: '未授权访问' });
    }

    const { friendshipId, userId, friendId, friend } = req.body;

    if (!friendshipId || !userId || !friendId || !friend) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 通知原请求发起者好友请求被接受
    io.to(`user:${friendId}`).emit('friend-request-accepted', {
      id: friendshipId,
      friendId: userId,
      friend: {
        id: friend.id,
        name: friend.name,
        avatarUrl: friend.avatarUrl
      }
    });

    console.log(`[Internal] 好友接受已广播: ${friendId} -> ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Friend accepted broadcast error:', error);
    res.status(500).json({ error: '广播好友接受失败' });
  }
});

/**
 * 用户 Socket 连接映射
 *
 * 数据结构：Map<userId, Set<socketId>>
 *
 * 说明：
 * - 一个用户可能有多个连接（多设备、多标签页）
 * - 使用 Set 存储该用户的所有 socketId
 * - 当 Set 为空时，用户完全离线
 */
const userSockets = new Map<string, Set<string>>();

/**
 * 性能优化：连接限流配置
 * 防止单个IP频繁连接造成服务器压力
 */
const CONNECTION_LIMITS = {
  maxAttemptsPerMinute: 10, // 每分钟最大连接尝试次数
  blockDurationMs: 60000, // 封禁持续时间（1分钟）
  cleanupIntervalMs: 60000, // 清理间隔（1分钟）
};

// 连接尝试记录：IP -> 尝试次数
const connectionAttempts = new Map<string, { count: number; firstAttempt: number }>();
// 封禁的IP列表
const blockedIPs = new Set<string>();

/**
 * Socket.io 认证中间件
 *
 * 验证流程：
 * 1. 检查IP是否被封禁
 * 2. 检查连接频率限制
 * 3. 从握手数据中获取 token 和 userId
 * 4. 验证 JWT token 有效性
 * 5. 验证 token 中的 userId 与请求的 userId 一致
 * 6. 验证用户是否存在于数据库
 * 7. 将用户信息附加到 socket.data
 */
io.use(async (socket, next) => {
  // 性能优化：获取客户端IP并进行限流检查
  const clientIP = socket.handshake.address || 'unknown';

  // 检查IP是否被封禁
  if (blockedIPs.has(clientIP)) {
    return next(new Error('连接过于频繁，请稍后再试'));
  }

  // 检查连接频率
  const now = Date.now();
  const attempts = connectionAttempts.get(clientIP);

  if (attempts) {
    // 如果在1分钟窗口内
    if (now - attempts.firstAttempt < 60000) {
      if (attempts.count >= CONNECTION_LIMITS.maxAttemptsPerMinute) {
        // 超过限制，加入封禁列表
        blockedIPs.add(clientIP);
        setTimeout(() => blockedIPs.delete(clientIP), CONNECTION_LIMITS.blockDurationMs);
        return next(new Error('连接过于频繁，请稍后再试'));
      }
      // 增加计数
      attempts.count++;
    } else {
      // 重置窗口
      attempts.count = 1;
      attempts.firstAttempt = now;
    }
  } else {
    connectionAttempts.set(clientIP, { count: 1, firstAttempt: now });
  }

  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;

  if (!token) {
    return next(new Error('Authentication error: token required'));
  }

  if (!userId) {
    return next(new Error('Authentication error: userId required'));
  }

  try {
    // 验证 JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // 验证 token 中的 userId 与请求的 userId 一致（防止 token 盗用）
    if (decoded.id !== userId) {
      return next(new Error('Authentication error: userId mismatch'));
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    // 将用户信息存储到 socket.data，供后续事件处理使用
    socket.data.userId = userId;
    socket.data.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication error: token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication error: invalid token'));
    }
    return next(new Error('Authentication error'));
  }
});

/**
 * Socket.io 连接处理
 *
 * 处理所有客户端连接事件
 */
io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  const user = socket.data.user;

  console.log(`User connected: ${user.name} (${userId})`);

  // 记录用户连接（支持多设备）
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);

  // 加入用户个人房间（用于私聊和通知）
  socket.join(`user:${userId}`);

  // 自动加入用户所有会话的房间（确保能收到所有会话的消息）
  try {
    const userConversations = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true }
    });

    userConversations.forEach(({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[房间] 用户 ${userId} 自动加入会话房间: conversation:${conversationId}`);
    });

    console.log(`[房间] 用户 ${userId} 已加入 ${userConversations.length} 个会话房间`);
  } catch (error) {
    console.error('[房间] 自动加入会话房间失败:', error);
  }

  // 通知好友用户上线
  broadcastUserStatus(userId, 'online');

  // ==================== 在线用户列表 ====================

  /**
   * 获取当前所有在线用户列表
   * 前端连接成功后调用此事件获取当前在线用户
   */
  socket.on('get-online-users', () => {
    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit('online-users-list', { users: onlineUserIds });
  });

  // ==================== 会话相关事件 ====================

  /**
   * 加入会话房间
   *
   * 验证：
   * - 用户必须是会话成员才能加入
   */
  socket.on('join-conversation', async (conversationId: string) => {
    try {
      // 验证用户是否是会话成员
      const member = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      if (!member) {
        socket.emit('error', { message: '你不是该会话的成员' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit('joined-conversation', { conversationId });

      console.log(`User ${userId} (socket:${socket.id}) joined conversation ${conversationId}`);
      // 调试：列出当前房间内的所有 socket
      const roomSockets = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
      console.log(`[调试] conversation:${conversationId} 房间内现有 ${roomSockets?.size || 0} 个连接`);
    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: '加入会话失败' });
    }
  });

  /**
   * 离开会话房间
   */
  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    socket.emit('left-conversation', { conversationId });
  });

  // ==================== 消息相关事件 ====================

  /**
   * 发送消息
   *
   * 流程：
   * 1. 验证会话成员身份
   * 2. 创建消息记录
   * 3. 更新会话时间
   * 4. 广播消息到会话房间
   * 5. 通知所有会话成员
   */
  socket.on('send-message', async (data: {
    conversationId: string
    content: string
  }) => {
    try {
      const { conversationId, content } = data;

      // 验证用户是否是会话成员
      const member = await prisma.conversationMember.findFirst({
        where: { conversationId, userId }
      });

      if (!member) {
        socket.emit('error', { message: '你不是该会话的成员' });
        return;
      }

      // 创建消息记录
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      // 更新会话更新时间（用于排序）
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // 广播消息到会话房间（排除发送者，避免重复）
      // 使用 socket.broadcast.to() 而不是 io.to()，发送者不会收到自己发的消息
      console.log(`[消息广播] 正在广播到 conversation:${conversationId}, 房间内连接数:`, io.sockets.adapter.rooms.get(`conversation:${conversationId}`)?.size || 0);

      // 获取房间内所有 socket
      const roomSockets = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
      if (roomSockets) {
        console.log(`[消息广播] 房间内的 socket IDs:`, Array.from(roomSockets));
        // 列出每个 socket 对应的用户 ID
        roomSockets.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket?.data?.userId) {
            console.log(`[调试] Socket ${socketId} -> 用户 ${socket.data.userId}`);
          }
        });
      } else {
        console.log(`[消息广播] 警告：房间 conversation:${conversationId} 内没有连接`);
      }

      // 先给发送者发送消息确认（包含临时ID映射，用于前端替换临时消息）
      socket.emit('message-sent', {
        tempId: `temp-${Date.now()}`, // 前端可以用这个匹配临时消息
        message
      });

      // 广播给房间内其他用户（排除发送者）
      socket.to(`conversation:${conversationId}`).emit('new-message', message);
      console.log(`[消息广播] 消息已广播（排除发送者）, messageId:`, message.id);

      // 获取会话所有成员，通知他们有新消息
      const members = await prisma.conversationMember.findMany({
        where: { conversationId },
        select: { userId: true }
      });

      // 发送会话更新通知给所有成员（用于更新会话列表）
      members.forEach(({ userId: memberId }) => {
        io.to(`user:${memberId}`).emit('conversation-updated', {
          conversationId,
          lastMessage: message
        });
      });

      console.log(`Message sent in conversation ${conversationId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: '发送消息失败' });
    }
  });

  // ==================== 输入状态 ====================

  /**
   * 开始输入
   * 广播给会话中的其他用户
   */
  socket.on('typing-start', (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      userId,
      userName: user.name,
      conversationId
    });
  });

  /**
   * 停止输入
   */
  socket.on('typing-stop', (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
      userId,
      conversationId
    });
  });

  // ==================== 好友相关事件 ====================

  /**
   * 发送好友请求
   *
   * 流程：
   * 1. 检查是否已经是好友
   * 2. 创建好友请求记录
   * 3. 通知目标用户
   */
  socket.on('friend-request', async (data: { friendId: string }) => {
    try {
      const { friendId } = data;

      // 检查是否已经是好友或已有待处理请求
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      if (existing) {
        socket.emit('error', { message: '已经是好友或请求已发送' });
        return;
      }

      // 创建好友请求（状态为 pending）
      const friendship = await prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: 'pending'
        },
        include: {
          friend: {
            select: { id: true, name: true, avatarUrl: true }
          }
        }
      });

      // 通知目标用户有新的好友请求
      io.to(`user:${friendId}`).emit('friend-request-received', {
        id: friendship.id,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl
        },
        createdAt: friendship.createdAt
      });

      // 通知发送者请求已发送
      socket.emit('friend-request-sent', { friendId });

      console.log(`Friend request from ${userId} to ${friendId}`);
    } catch (error) {
      console.error('Friend request error:', error);
      socket.emit('error', { message: '发送好友请求失败' });
    }
  });

  /**
   * 接受好友请求
   *
   * 流程：
   * 1. 验证好友请求存在且是发给自己的
   * 2. 更新好友请求状态为 accepted
   * 3. 创建反向好友关系（双向好友）
   * 4. 通知双方
   */
  socket.on('accept-friend', async (data: { friendshipId: string }) => {
    try {
      const { friendshipId } = data;

      // 查找好友请求（必须是发给自己的）
      const friendship = await prisma.friendship.findFirst({
        where: {
          id: friendshipId,
          friendId: userId,
          status: 'pending'
        }
      });

      if (!friendship) {
        socket.emit('error', { message: '好友请求不存在' });
        return;
      }

      // 更新好友请求状态为已接受
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });

      // 创建反向好友关系（实现双向好友）
      await prisma.friendship.create({
        data: {
          userId,
          friendId: friendship.userId,
          status: 'accepted'
        }
      });

      // 通知发送者好友请求被接受
      io.to(`user:${friendship.userId}`).emit('friend-request-accepted', {
        friendId: userId,
        friendName: user.name
      });

      // 通知接受者好友添加成功
      socket.emit('friend-added', {
        friendId: friendship.userId
      });

      console.log(`Friend request accepted: ${friendshipId}`);
    } catch (error) {
      console.error('Accept friend error:', error);
      socket.emit('error', { message: '接受好友请求失败' });
    }
  });

  // ==================== 断开连接 ====================

  /**
   * 断开连接处理
   *
   * 清理工作：
   * 1. 从连接映射中移除
   * 2. 如果用户所有连接都断开，通知好友离线
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.name} (${userId})`);

    // 移除连接记录
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      // 如果用户所有连接都断开，通知好友离线
      if (sockets.size === 0) {
        userSockets.delete(userId);
        broadcastUserStatus(userId, 'offline');
      }
    }
  });
});

/**
 * 广播用户状态给好友
 *
 * 当用户上线/下线时，通知所有好友
 *
 * @param userId - 用户 ID
 * @param status - 状态（online/offline）
 */
async function broadcastUserStatus(userId: string, status: 'online' | 'offline') {
  try {
    console.log(`Broadcasting user status: ${userId} is ${status}`);

    // 获取用户的好友列表
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      },
      select: {
        userId: true,
        friendId: true
      }
    });

    // 提取好友 ID（排除自己）
    const friendIds = new Set<string>();
    friendships.forEach(f => {
      if (f.userId !== userId) friendIds.add(f.userId);
      if (f.friendId !== userId) friendIds.add(f.friendId);
    });

    console.log(`User ${userId} has ${friendIds.size} friends to notify`);

    // 通知所有好友用户状态变化
    friendIds.forEach(friendId => {
      console.log(`Emitting user-status to user:${friendId}`);
      io.to(`user:${friendId}`).emit('user-status', {
        userId,
        status,
        timestamp: new Date()
      });
    });
  } catch (error) {
    console.error('Broadcast user status error:', error);
  }
}

/**
 * 性能优化：定期清理无效连接
 *
 * 清理内容：
 * 1. 检查 userSockets 中的无效 socketId
 * 2. 清理过期的连接尝试记录
 * 3. 清理过期的封禁记录
 */
function setupCleanupInterval() {
  setInterval(async () => {
    const now = Date.now();
    let cleanedSockets = 0;
    let cleanedAttempts = 0;

    // 清理 userSockets 中的无效连接
    for (const [userId, sockets] of userSockets.entries()) {
      const activeSockets = new Set<string>();

      for (const socketId of sockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.connected) {
          activeSockets.add(socketId);
        } else {
          cleanedSockets++;
        }
      }

      if (activeSockets.size === 0) {
        userSockets.delete(userId);
        // 通知好友离线
        broadcastUserStatus(userId, 'offline');
      } else if (activeSockets.size !== sockets.size) {
        userSockets.set(userId, activeSockets);
      }
    }

    // 清理过期的连接尝试记录（超过2分钟的）
    for (const [ip, attempt] of connectionAttempts.entries()) {
      if (now - attempt.firstAttempt > 120000) {
        connectionAttempts.delete(ip);
        cleanedAttempts++;
      }
    }

    if (cleanedSockets > 0 || cleanedAttempts > 0) {
      console.log(`[Cleanup] 清理了 ${cleanedSockets} 个无效连接, ${cleanedAttempts} 条过期记录`);
    }
  }, CONNECTION_LIMITS.cleanupIntervalMs);
}

// ==================== 服务器启动 ====================

const PORT = process.env.PORT || 3001;

/**
 * 启动服务器
 */
async function start() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('Database connected');

    // 启动定期清理任务
    setupCleanupInterval();
    console.log('Cleanup interval started');

    httpServer.listen(PORT, () => {
      console.log(`Socket.io server running on port ${PORT}`);
      console.log(`CORS origin: ${corsOrigin}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

/**
 * 优雅关闭
 *
 * 收到 SIGTERM 信号时：
 * 1. 断开数据库连接
 * 2. 关闭 HTTP 服务器
 * 3. 退出进程
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
