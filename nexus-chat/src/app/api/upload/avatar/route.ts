/**
 * 头像上传 API 路由
 *
 * 功能：
 * - POST: 上传用户头像图片
 *
 * 认证：需要用户登录
 *
 * 安全措施：
 * - 文件大小限制
 * - MIME 类型验证
 * - 文件魔数验证（防止伪造文件）
 * - 文件名随机化
 * - 路径安全验证
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

import { authOptions } from '@/lib/auth'

/**
 * 安全地写入文件到指定目录
 * 此函数确保文件只能写入到允许的安全目录中
 */
async function safeWriteFile(
  targetDir: string,
  fileName: string,
  data: Buffer
): Promise<void> {
  // 验证文件名不包含路径遍历字符
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Invalid filename: path traversal detected')
  }

  const filePath = join(targetDir, fileName)

  // 验证最终路径仍在目标目录内
  if (!filePath.startsWith(targetDir)) {
    throw new Error('Invalid file path: outside of target directory')
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(filePath, data)
}

/**
 * 允许的图片格式
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars')

/**
 * 验证文件魔数
 * 确保文件内容与声明的 MIME 类型匹配
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  let signatures: { signature: Buffer; offset: number }[] = []

  switch (mimeType) {
    case 'image/jpeg':
      signatures = [
        { signature: Buffer.from([0xFF, 0xD8, 0xFF]), offset: 0 }
      ]
      break
    case 'image/png':
      signatures = [
        { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), offset: 0 }
      ]
      break
    case 'image/gif':
      signatures = [
        { signature: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), offset: 0 },
        { signature: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), offset: 0 }
      ]
      break
    case 'image/webp':
      signatures = [
        { signature: Buffer.from([0x52, 0x49, 0x46, 0x46]), offset: 0 }
      ]
      break
    default:
      return false
  }

  for (const { signature, offset } of signatures) {
    if (buffer.length < offset + signature.length) continue

    const fileHeader = buffer.subarray(offset, offset + signature.length)
    if (fileHeader.equals(signature)) {
      // WebP 需要额外检查
      if (mimeType === 'image/webp') {
        // 检查 offset 8 处是否有 WEBP 标识
        if (buffer.length >= 12) {
          const webpMarker = buffer.subarray(8, 12).toString('ascii')
          return webpMarker === 'WEBP'
        }
        return false
      }
      return true
    }
  }
  return false
}

/**
 * 确保上传目录存在
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    default:
      return '.jpg'
  }
}

/**
 * 上传头像
 *
 * 请求体：FormData (file)
 * 返回：头像 URL
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析 FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 })
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 2MB' }, { status: 400 })
    }

    // 验证文件格式
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG、PNG、GIF、WebP 格式' }, { status: 400 })
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 安全验证：检查文件魔数，防止伪造文件
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json({ error: '文件内容与格式不匹配，可能是伪造文件' }, { status: 400 })
    }

    // 确保上传目录存在
    await ensureUploadDir()

    // 生成唯一文件名
    const fileExtension = getFileExtension(file.type)
    const fileName = `${randomUUID()}${fileExtension}`

    // 使用安全的文件写入函数
    await safeWriteFile(UPLOAD_DIR, fileName, buffer)

    // 返回文件 URL
    const fileUrl = `/uploads/avatars/${fileName}`

    return NextResponse.json({ data: { url: fileUrl } })
  } catch (error) {
    console.error('上传头像失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}   //代码结束
