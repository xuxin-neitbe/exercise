/**
 * 用户搜索 API 路由
 *
 * 功能：
 * - GET: 搜索用户（用于添加好友）
 *
 * 认证：需要用户登录
 *
 * 查询参数：
 * - q: 搜索关键词（匹配用户名或邮箱）
 *
 * 返回：匹配的用户列表（排除当前用户）
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { userService } from '@/services'

/**
 * 搜索用户
 *
 * 根据关键词搜索用户名或邮箱
 * 结果中不包含当前用户
 *
 * 用途：添加好友时查找用户
 */
export async function GET(request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 获取搜索关键词
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''

        // 搜索用户（排除当前用户）
        const results = await userService.searchUsers(query, session.user.id)

        return NextResponse.json({ data: results })
    } catch (error) {
        console.error('搜索用户失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '服务器错误' },
            { status: 500 }
        )
    }
}
