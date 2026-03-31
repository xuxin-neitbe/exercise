/**
 * 用户资料 API 路由
 *
 * 功能：
 * - GET: 获取当前用户的资料
 * - PUT: 更新当前用户的资料
 *
 * 认证：需要用户登录
 */
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 获取当前用户资料
 *
 * 返回：用户基本信息（id, name, email, avatarUrl, createdAt, updatedAt）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * 更新当前用户资料
 *
 * 请求体：
 * - name: 新用户名（可选）
 * - email: 新邮箱（可选）
 * - avatarUrl: 新头像 URL（可选）
 *
 * 返回：更新后的用户信息
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { name, email, avatarUrl } = body

    // 验证邮箱格式
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
      }

      // 检查邮箱是否已被其他用户使用
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: '邮箱已被其他用户使用' }, { status: 400 })
      }
    }

    // 构建更新数据
    const updateData: { name?: string; email?: string; avatarUrl?: string } = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    // 更新用户信息
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
