/**
 * 好友请求处理 API 路由
 *
 * 功能：
 * - POST: 接受好友请求
 * - DELETE: 拒绝好友请求
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
 * 通知 Socket 服务器广播好友接受事件
 * 通过内部 API 触发实时推送
 */
async function notifyFriendAccepted(
    friendshipId: string,
    userId: string,
    friendId: string,
    friend: { id: string; name?: string | null; image?: string | null }
) {
    try {
        await fetch(`${SOCKET_SERVER_URL}/internal/friend-accepted`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-API-Key': INTERNAL_API_KEY
            },
            body: JSON.stringify({
                friendshipId,
                userId,
                friendId,
                friend: {
                    id: friend.id,
                    name: friend.name,
                    avatarUrl: friend.image
                }
            })
        })
    } catch (error) {
        console.error('通知 Socket 服务器失败:', error)
    }
}

/**
 * 接受好友请求
 *
 * 请求体：
 * - friendshipId: 好友请求 ID
 *
 * 验证：
 * - 只能接受发给自己的好友请求
 *
 * 接受后双方成为好友
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
        const { friendshipId } = body

        if (!friendshipId) {
            return NextResponse.json({ error: '好友请求ID不能为空' }, { status: 400 })
        }

        // 接受好友请求（Service 层会验证请求接收者）
        // 返回好友请求发起者的 ID
        const requesterId = await friendshipService.acceptFriend(friendshipId, session.user.id)

        // 通知 Socket 服务器广播好友接受事件（异步，不阻塞响应）
        notifyFriendAccepted(
            friendshipId,
            session.user.id,
            requesterId,
            session.user
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('接受好友请求失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}

/**
 * 拒绝好友请求
 *
 * 查询参数：
 * - friendshipId: 好友请求 ID
 *
 * 验证：
 * - 只能拒绝发给自己的好友请求
 *
 * 拒绝后好友请求记录会被删除
 */
export async function DELETE(request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 获取好友请求 ID
        const { searchParams } = new URL(request.url)
        const friendshipId = searchParams.get('friendshipId')

        if (!friendshipId) {
            return NextResponse.json({ error: '好友请求ID不能为空' }, { status: 400 })
        }

        // 拒绝好友请求
        await friendshipService.rejectFriend(friendshipId, session.user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('拒绝好友请求失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}
