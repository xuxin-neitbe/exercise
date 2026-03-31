/**
 * AI 配置 API
 *
 * 职责：
 * - 返回 AI 服务配置信息（不含敏感信息）
 * - 返回用户使用统计
 * - 返回提供商信息
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import {
  AI_CONFIG,
  AI_LIMITS,
  AI_PROVIDER_CONFIG,
  isAIConfigValid,
} from '@/lib/ai/config'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ai/config
 * 获取 AI 配置信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 获取当前提供商配置
    const providerConfig = AI_PROVIDER_CONFIG[AI_CONFIG.provider]

    // 获取用户使用统计
    const usageStats = await getUsageStats(session.user.id)

    return NextResponse.json({
      // 配置信息（不包含敏感字段）
      config: {
        provider: AI_CONFIG.provider,
        model: AI_CONFIG.model,
        suggestionCount: AI_CONFIG.suggestionCount,
        dailyLimit: AI_CONFIG.dailyLimit,
        timeout: AI_CONFIG.timeout,
        maxRetries: AI_CONFIG.maxRetries,
      },
      // 提供商信息
      provider: {
        name: providerConfig?.name || AI_CONFIG.provider,
        models: providerConfig?.models || [],
      },
      // 限制配置
      limits: {
        maxMessagesPerRequest: AI_LIMITS.maxMessagesPerRequest,
        maxMessageLength: AI_LIMITS.maxMessageLength,
        minMessagesForSuggestion: AI_LIMITS.minMessagesForSuggestion,
        maxSuggestionLength: AI_LIMITS.maxSuggestionLength,
        cacheTTL: AI_LIMITS.cacheTTL,
      },
      // 配置是否有效
      isValid: isAIConfigValid(),
      // 使用统计
      usageStats,
    })
  } catch (error) {
    console.error('获取 AI 配置失败:', error)
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    )
  }
}

/**
 * 获取用户使用统计
 */
async function getUsageStats(userId: string): Promise<{
  userId: string
  todayUsage: number
  remainingUsage: number
  totalUsage: number
  lastUsedAt: Date | null
} | null> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 获取今日使用记录
    const todayUsage = await prisma.aISuggestionUsage.findUnique({
      where: {
        userId_usageDate: {
          userId,
          usageDate: today,
        },
      },
    })

    // 获取总使用次数
    const totalUsageResult = await prisma.aISuggestionUsage.aggregate({
      where: { userId },
      _sum: { count: true },
    })

    // 获取最后使用时间
    const lastUsage = await prisma.aISuggestionUsage.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    const todayCount = todayUsage?.count || 0
    const totalCount = totalUsageResult._sum.count || 0

    return {
      userId,
      todayUsage: todayCount,
      remainingUsage: Math.max(AI_CONFIG.dailyLimit - todayCount, 0),
      totalUsage: totalCount,
      lastUsedAt: lastUsage?.updatedAt || null,
    }
  } catch (error) {
    console.error('获取使用统计失败:', error)
    return null
  }
}
