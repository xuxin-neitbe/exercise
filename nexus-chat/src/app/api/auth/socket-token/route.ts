import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import jwt from 'jsonwebtoken'

import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 安全检查：确保 NEXTAUTH_SECRET 已配置
        const jwtSecret = process.env.NEXTAUTH_SECRET
        if (!jwtSecret) {
            console.error('NEXTAUTH_SECRET 未配置，请设置环境变量')
            return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
        }

        const token = jwt.sign(
            { id: session.user.id },
            jwtSecret,
            { expiresIn: '1h' }
        )

        return NextResponse.json({ token })
    } catch (error) {
        console.error('生成Socket token失败:', error)
        return NextResponse.json({ error: '生成token失败' }, { status: 500 })
    }
}
