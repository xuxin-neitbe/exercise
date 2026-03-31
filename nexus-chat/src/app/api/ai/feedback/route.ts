/**
 * AI 反馈 API
 *
 * 职责：
 * - 处理用户对 AI 建议的反馈（点赞/点踩）
 * - 记录反馈数据用于后续分析
 * - 支持更新已有反馈
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * 反馈请求体类型定义
 */
interface FeedbackRequestBody {
  suggestionId: string
  feedbackType: 'positive' | 'negative'
  suggestionContent?: string
  conversationId?: string
}

/**
 * POST /api/ai/feedback
 * 提交用户反馈
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 解析请求体
    let body: FeedbackRequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '无效的请求体' },
        { status: 400 }
      )
    }

    // 验证请求参数
    const validationError = validateRequest(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // 检查是否已存在反馈记录
    const existingFeedback = await prisma.aISuggestionFeedback.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId: body.suggestionId,
        },
      },
    })

    let feedback
    if (existingFeedback) {
      // 更新已有反馈
      feedback = await prisma.aISuggestionFeedback.update({
        where: {
          id: existingFeedback.id,
        },
        data: {
          feedbackType: body.feedbackType,
          suggestionContent: body.suggestionContent ?? existingFeedback.suggestionContent,
          conversationId: body.conversationId ?? existingFeedback.conversationId,
        },
      })
    } else {
      // 创建新的反馈记录
      feedback = await prisma.aISuggestionFeedback.create({
        data: {
          userId: session.user.id,
          suggestionId: body.suggestionId,
          feedbackType: body.feedbackType,
          suggestionContent: body.suggestionContent,
          conversationId: body.conversationId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: '感谢您的反馈',
      feedback: {
        id: feedback.id,
        feedbackType: feedback.feedbackType,
      },
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    return NextResponse.json(
      { error: '提交反馈失败，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * 验证请求参数
 */
function validateRequest(body: FeedbackRequestBody): string | null {
  // 检查建议 ID
  if (!body.suggestionId || body.suggestionId.trim().length === 0) {
    return '建议 ID 不能为空'
  }

  // 检查反馈类型
  if (!body.feedbackType) {
    return '反馈类型不能为空'
  }

  // 验证反馈类型值
  if (!['positive', 'negative'].includes(body.feedbackType)) {
    return '反馈类型无效，必须是 positive 或 negative'
  }

  return null
}
