/**
 * 会话 API 路由
 *
 * 功能：
 * - GET: 获取当前用户的所有会话列表
 * - POST: 创建新会话（私聊或群聊）
 *
 * 认证：需要用户登录（通过 NextAuth session 验证）
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { conversationService } from '@/services'

/**
 * 获取会话列表
 *
 * 返回当前用户参与的所有会话，按更新时间倒序排列
 * 每个会话包含成员信息和最后一条消息
 */
export async function GET() {
  try {
    // 获取当前登录用户的 session
    const session = await getServerSession(authOptions)

    // 验证用户是否已登录
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取用户的会话列表
    const conversations = await conversationService.listUserConversations(session.user.id)

    return NextResponse.json({ data: conversations })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 创建新会话
 *
 * 请求体：
 * - isGroup: 是否是群聊
 * - name: 群聊名称（群聊必填）
 * - memberIds: 成员 ID 列表
 *
 * 私聊：如果已存在与对方的私聊会话，返回现有会话
 * 群聊：创建新的群聊会话
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { isGroup, name, memberIds } = body

    // 创建私聊会话
    if (!isGroup && memberIds && memberIds.length > 0) {
      const conversation = await conversationService.createPrivateConversation(
        session.user.id,
        memberIds[0]
      )
      return NextResponse.json({ data: conversation })
    }

    // 创建群聊会话
    if (isGroup) {
      // 群聊必须有名称
      if (!name) {
        return NextResponse.json({ error: '群聊名称不能为空' }, { status: 400 })
      }
      const conversation = await conversationService.createGroupConversation(
        session.user.id,
        name,
        memberIds || []
      )
      return NextResponse.json({ data: conversation })
    }

    return NextResponse.json({ error: '无效的请求参数' }, { status: 400 })
  } catch (error) {
    console.error('创建会话失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
