/**
 * AI 建议生成 API
 *
 * 职责：
 * - 处理 POST 请求：生成 AI 对话建议
 * - 处理 GET 请求：获取用户使用统计
 * - 验证用户登录状态
 * - 检查每日使用限制
 * - 使用 Vercel AI SDK 调用 AI 服务生成建议
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generateText } from 'ai'

import { AI_CONFIG, AI_ERROR_MESSAGES, AI_LIMITS, createProvider, isAIConfigValid } from '@/lib/ai/config'
import {
  buildCompletePrompt,
  detectMaliciousInput,
  filterUnsafeContent,
  PROMPT_VERSION,
  validateSuggestionOutput,
} from '@/lib/ai/prompt-templates'
import { authOptions } from '@/lib/auth'
import { apiLog, debugLog, errorLog } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import type { AIMessageContext, AISuggestion } from '@/types/ai'

/**
 * 请求体类型定义
 */
interface SuggestionsRequestBody {
  messages: AIMessageContext[]
  conversationId?: string
  suggestionCount?: number
  suggestionTypes?: AISuggestion['type'][]
}

/**
 * GET /api/ai/suggestions
 * 获取用户使用统计
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

    // 获取使用统计
    const usageStats = await getUsageStats(session.user.id)

    return NextResponse.json({
      usageStats,
    })
  } catch (error) {
    console.error('获取使用统计失败:', error)
    return NextResponse.json(
      { error: '获取使用统计失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/suggestions
 * 生成 AI 对话建议
 */
export async function POST(request: NextRequest) {
  apiLog('POST /api/ai/suggestions called')

  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)
    apiLog('Session:', session ? { userId: session.user?.id } : 'No session')

    if (!session?.user?.id) {
      apiLog('Unauthorized - no session')
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 验证 AI 配置
    if (!isAIConfigValid()) {
      apiLog('AI config invalid - no API key')
      return NextResponse.json(
        { error: AI_ERROR_MESSAGES.PROVIDER_UNAVAILABLE },
        { status: 500 }
      )
    }

    // 解析请求体
    let body: SuggestionsRequestBody
    try {
      body = await request.json()
      debugLog('Request body:', {
        messagesCount: body.messages?.length,
        conversationId: body.conversationId
      })
    } catch {
      apiLog('Invalid request body')
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

    // 检查使用限制
    const limitCheck = await checkUsageLimit(session.user.id)
    if (limitCheck.exceeded) {
      return NextResponse.json(
        { error: AI_ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED, code: 'DAILY_LIMIT_EXCEEDED' },
        { status: 429 }
      )
    }

    // 准备消息上下文
    const messages = prepareMessages(body.messages)

    // 调用 AI API 生成建议
    const suggestions = await generateAISuggestions(messages, body.suggestionCount)

    // 增加使用次数
    await incrementUsage(session.user.id)

    // 获取更新后的使用统计
    const usageStats = await getUsageStats(session.user.id)

    return NextResponse.json({
      success: true,
      suggestions,
      provider: AI_CONFIG.provider,
      model: AI_CONFIG.model,
      usageStats: {
        remaining: usageStats.remainingUsage,
        todayUsage: usageStats.todayUsage,
        totalUsage: usageStats.totalUsage,
      },
    })
  } catch (error) {
    errorLog('生成 AI 建议失败:', error)

    // 根据错误类型返回不同的错误信息
    const errorMessage = error instanceof Error ? error.message : AI_ERROR_MESSAGES.UNKNOWN
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * 验证请求参数
 */
function validateRequest(body: SuggestionsRequestBody): string | null {
  // 检查消息是否存在
  if (!body.messages || !Array.isArray(body.messages)) {
    return '消息列表不能为空'
  }

  // 检查消息数量
  if (body.messages.length < AI_LIMITS.minMessagesForSuggestion) {
    return '消息数量不足，无法生成建议'
  }

  // 检查每条消息的内容
  for (const msg of body.messages) {
    if (!msg.content || msg.content.trim().length === 0) {
      return '消息内容不能为空'
    }
  }

  return null
}

/**
 * 准备消息上下文
 * 截断过长的消息和过多的消息数量
 */
function prepareMessages(messages: AIMessageContext[]): AIMessageContext[] {
  return messages
    .slice(-AI_LIMITS.maxMessagesPerRequest)
    .map(msg => ({
      ...msg,
      content: msg.content.length > AI_LIMITS.maxMessageLength
        ? msg.content.slice(0, AI_LIMITS.maxMessageLength)
        : msg.content,
    }))
}

/**
 * 检查用户使用限制
 */
async function checkUsageLimit(userId: string): Promise<{ exceeded: boolean; remaining: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 查找今日使用记录
  const usage = await prisma.aISuggestionUsage.findUnique({
    where: {
      userId_usageDate: {
        userId,
        usageDate: today,
      },
    },
  })

  const todayUsage = usage?.count || 0
  const remaining = Math.max(AI_CONFIG.dailyLimit - todayUsage, 0)

  return {
    exceeded: todayUsage >= AI_CONFIG.dailyLimit,
    remaining,
  }
}

/**
 * 增加用户使用次数
 */
async function incrementUsage(userId: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 使用 upsert 创建或更新使用记录
  await prisma.aISuggestionUsage.upsert({
    where: {
      userId_usageDate: {
        userId,
        usageDate: today,
      },
    },
    create: {
      userId,
      usageDate: today,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  })
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
}> {
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
}

/**
 * 调用 AI API 生成建议
 * 使用 Vercel AI SDK 调用 AI 服务
 *
 * 优化后的版本：
 * - 使用结构化提示词模板
 * - 添加安全检查和输入验证
 * - 支持 Few-shot 学习
 * - 使用 Vercel AI SDK 统一调用方式
 */
async function generateAISuggestions(
  messages: AIMessageContext[],
  suggestionCount?: number
): Promise<AISuggestion[]> {
  const count = Math.min(Math.max(suggestionCount || AI_CONFIG.suggestionCount, 1), 3)

  // ==================== 安全检查 ====================

  // 检测恶意输入
  for (const msg of messages) {
    const maliciousCheck = detectMaliciousInput(msg.content)
    if (maliciousCheck.isMalicious) {
      debugLog('检测到恶意输入:', maliciousCheck.reason)
      // 返回安全的默认建议，而不是抛出错误
      return getDefaultSuggestions()
    }
  }

  // ==================== 构建提示词 ====================

  // 使用新的提示词模板构建系统提示和用户提示
  const { systemPrompt, userPrompt } = buildCompletePrompt(messages, count, {
    includeFewShot: true, // 启用 Few-shot 示例
    strictMode: true, // 启用严格安全模式
  })

  debugLog('提示词版本:', PROMPT_VERSION)

  // ==================== 调用 AI API（使用 Vercel AI SDK）====================

  try {
    // 创建提供商实例
    const provider = createProvider(AI_CONFIG.provider, AI_CONFIG.apiKey)

    // 使用 Vercel AI SDK 的 generateText 方法
    const result = await generateText({
      model: provider(AI_CONFIG.model),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxOutputTokens: 800, // 增加输出长度以容纳 Few-shot 示例
      temperature: 0.7,
      topP: 0.9,
      abortSignal: AbortSignal.timeout(AI_CONFIG.timeout),
    })

    // 从 SDK 结果中获取响应内容
    const content = result.text
    debugLog('AI API 响应:', { hasContent: !!content, textLength: content.length })

    // ==================== 解析和验证响应 ====================

    const suggestions = parseAIResponse(content, count)

    // 验证输出格式
    const validation = validateSuggestionOutput(suggestions)
    if (!validation.valid) {
      debugLog('输出验证失败:', validation.error)
      return getDefaultSuggestions()
    }

    // 内容安全过滤
    const safeSuggestions = (validation.suggestions || []).filter(s => {
      const filterResult = filterUnsafeContent(s.content)
      if (!filterResult.safe) {
        debugLog('过滤不安全内容:', filterResult.reason)
      }
      return filterResult.safe
    })

    debugLog('解析后的建议数量:', safeSuggestions.length)

    return safeSuggestions.length > 0 ? safeSuggestions : getDefaultSuggestions()
  } catch (error) {
    // SDK 调用失败时返回默认建议（降级处理）
    errorLog('AI SDK 调用失败:', error)
    return getDefaultSuggestions()
  }
}

/**
 * 获取默认的安全建议
 * 当 AI 无法生成有效建议时的降级方案
 */
function getDefaultSuggestions(): AISuggestion[] {
  return [
    {
      id: `sug-default-${Date.now()}-1`,
      content: '好的，我明白了。',
      type: 'reply',
      confidence: 0.5,
      createdAt: new Date(),
    },
    {
      id: `sug-default-${Date.now()}-2`,
      content: '谢谢你的消息，稍后回复你。',
      type: 'reply',
      confidence: 0.5,
      createdAt: new Date(),
    },
  ]
}

/**
 * 解析 AI 响应内容
 */
function parseAIResponse(content: string, expectedCount: number): AISuggestion[] {
  try {
    // 尝试提取 JSON 数组
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!Array.isArray(parsed)) {
      throw new Error('AI 响应格式错误')
    }

    // 规范化建议数据
    const suggestions: AISuggestion[] = parsed.slice(0, expectedCount).map((item, index) => ({
      id: `sug-${Date.now()}-${index}`,
      content: String(item.content || '').slice(0, AI_LIMITS.maxSuggestionLength),
      type: ['reply', 'question', 'topic'].includes(item.type) ? item.type : 'reply',
      confidence: Math.min(Math.max(Number(item.confidence) || 0.5, 0), 1),
      createdAt: new Date(),
    }))

    // 过滤掉空内容
    return suggestions.filter(s => s.content.trim().length > 0)
  } catch (error) {
    console.error('解析 AI 响应失败:', error, content)
    // 返回空数组，让上层处理
    return []
  }
}
