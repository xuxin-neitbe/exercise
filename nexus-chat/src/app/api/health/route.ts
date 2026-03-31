import { NextResponse } from 'next/server'

/**
 * 健康检查 API 端点
 * 用于 Docker 健康检查和负载均衡器探测
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 503 }
    )
  }
}
