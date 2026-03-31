/**
 * 用户注册 API 路由
 *
 * 功能：
 * - 接收用户注册信息（邮箱、密码、用户名）
 * - 验证输入参数
 * - 创建新用户账户
 *
 * 请求方法：POST
 * 请求体：{ email: string, password: string, name: string }
 *
 * 响应：
 * - 成功：{ success: true, user: { id, email, name } }
 * - 失败：{ error: string }
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { userService } from '@/services'

/**
 * 注册请求参数验证 Schema
 *
 * 验证规则：
 * - email: 必须是有效的邮箱格式
 * - password: 至少 6 个字符
 * - name: 1-50 个字符
 */
const registerSchema = z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少6个字符'),
    name: z.string().min(1, '用户名不能为空').max(50, '用户名过长')
})

/**
 * 处理用户注册请求
 *
 * 流程：
 * 1. 解析请求体
 * 2. 验证输入参数
 * 3. 检查邮箱是否已注册
 * 4. 加密密码
 * 5. 创建用户
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 验证输入参数
        const result = registerSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password, name } = result.data

        // 检查邮箱是否已注册（Service 层会再次检查，这里提前返回更友好）
        const existingUser = await userService.getUserByEmail(email)
        if (existingUser) {
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            )
        }

        // 使用 bcrypt 加密密码（salt rounds = 10）
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户（密码已加密）
        const user = await userService.createUser({
            email,
            password: hashedPassword,
            name
        })

        // 返回成功响应（不包含密码）
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        })
    } catch (error) {
        console.error('注册失败:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '注册失败' },
            { status: 500 }
        )
    }
}
