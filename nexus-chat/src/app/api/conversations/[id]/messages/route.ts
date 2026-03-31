/**
 * 消息 API 路由
 *
 * 功能：
 * - GET: 获取指定会话的消息列表（支持分页）
 * - POST: 发送新消息
 *
 * 路由参数：
 * - id: 会话 ID
 *
 * 权限验证：只有会话成员才能获取/发送消息
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { conversationService,messageService } from '@/services'

// Socket 服务器内部 API 地址
const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001'

/**
 * 获取会话消息列表
 *
 * 查询参数：
 * - limit: 每次加载的消息数量（默认 50）
 * - before: 加载此消息 ID 之前的消息（用于分页）
 *
 * 返回：消息列表（按时间倒序）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证用户是否是会话成员（权限检查）
    const isMember = await conversationService.isMember(session.user.id, params.id)
    if (!isMember) {
      return NextResponse.json({ error: '无权访问此会话' }, { status: 403 })
    }

    // 解析分页参数
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const before = searchParams.get('before') || undefined

    // 获取消息列表
    const messages = await messageService.getMessages(params.id, { limit, before })

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('获取消息列表失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 发送新消息
 *
 * 请求体：
 * - content: 消息内容
 *
 * 验证：
 * - 消息内容不能为空
 * - 消息内容不超过 5000 字符
 * - 用户必须是会话成员
 *
 * 返回：新创建的消息（包含发送者信息）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { content } = body

    // 验证消息内容
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 })
    }

    // 限制消息长度
    if (content.length > 5000) {
      return NextResponse.json({ error: '消息内容过长' }, { status: 400 })
    }

    // 发送消息（Service 层会验证会话成员身份）
    const message = await messageService.sendMessage(params.id, session.user.id, content)

    // 异步通知 Socket 服务器广播消息（不阻塞响应）
    fetch(`${SOCKET_SERVER_URL}/internal/broadcast-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: params.id,
        message
      })
    }).catch(error => {
      // 广播失败只记录日志，不影响消息发送结果
      console.error('Socket 广播失败:', error)
    })

    return NextResponse.json({ data: message })
  } catch (error) {
    console.error('发送消息失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
