/**
 * 好友 API 路由
 *
 * 功能：
 * - GET: 获取当前用户的好友列表
 * - POST: 发送好友请求
 * - DELETE: 删除好友
 *
 * 认证：需要用户登录
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { friendshipService } from '@/services'

// Socket 服务器内部 API 地址
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-internal-api-key'

/**
 * 通知 Socket 服务器广播好友请求
 * 通过内部 API 触发实时推送
 */
async function notifyFriendRequest(
    friendshipId: string,
    userId: string,
    friendId: string,
    user: { id: string; name?: string | null; image?: string | null }
) {
    try {
        await fetch(`${SOCKET_SERVER_URL}/internal/friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-API-Key': INTERNAL_API_KEY
            },
            body: JSON.stringify({
                friendshipId,
                userId,
                friendId,
                user: {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.image
                }
            })
        })
    } catch (error) {
        // 广播失败不影响主流程，只记录日志
        console.error('通知 Socket 服务器失败:', error)
    }
}

/**
 * 获取好友列表
 *
 * 返回当前用户所有已接受的好友
 * 每个好友包含用户基本信息（id, name, email, avatarUrl）
 */
export async function GET() {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 获取好友关系列表
        const friendships = await friendshipService.getFriends(session.user.id)

        // 提取好友用户信息，去除 Friendship 包装
        const friends = friendships.map(f => f.friend)

        return NextResponse.json({ data: friends })
    } catch (error) {
        console.error('获取好友列表失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}

/**
 * 发送好友请求
 *
 * 请求体：
 * - friendId: 目标用户 ID
 *
 * 验证：
 * - 不能添加自己为好友
 * - 不能重复添加好友
 *
 * 返回：新创建的好友关系
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
        const { friendId } = body

        // 验证好友 ID
        if (!friendId) {
            return NextResponse.json({ error: '好友ID不能为空' }, { status: 400 })
        }

        // 不能添加自己为好友
        if (friendId === session.user.id) {
            return NextResponse.json({ error: '不能添加自己为好友' }, { status: 400 })
        }

        // 发送好友请求
        const friendship = await friendshipService.addFriend(session.user.id, friendId)

        // 通知 Socket 服务器广播好友请求（异步，不阻塞响应）
        notifyFriendRequest(
            friendship.id,
            session.user.id,
            friendId,
            session.user
        )

        return NextResponse.json({ data: friendship })
    } catch (error) {
        console.error('添加好友失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}

/**
 * 删除好友
 *
 * 查询参数：
 * - friendId: 要删除的好友 ID
 *
 * 删除后双方好友关系都会解除
 */
export async function DELETE(request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 获取要删除的好友 ID
        const { searchParams } = new URL(request.url)
        const friendId = searchParams.get('friendId')

        if (!friendId) {
            return NextResponse.json({ error: '好友ID不能为空' }, { status: 400 })
        }

        // 删除好友关系
        await friendshipService.removeFriend(session.user.id, friendId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('删除好友失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}
