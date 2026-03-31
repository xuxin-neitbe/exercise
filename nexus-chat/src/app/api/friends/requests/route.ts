/**
 * 好友请求列表 API 路由
 *
 * 功能：
 * - GET: 获取待处理的好友请求列表
 *
 * 认证：需要用户登录
 *
 * 返回：发给当前用户的待处理好友请求
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { friendshipService } from '@/services'

/**
 * 获取待处理的好友请求
 *
 * 返回所有发给当前用户的、状态为 pending 的好友请求
 * 每个请求包含发送者信息
 */
export async function GET() {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 获取待处理的好友请求
        const requests = await friendshipService.getPendingRequests(session.user.id)

        return NextResponse.json({ data: requests })
    } catch (error) {
        console.error('获取好友请求失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}
