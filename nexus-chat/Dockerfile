# ========================================
# Stage 1: 依赖安装
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

# 安装编译依赖（Prisma 需要）
RUN apk add --no-cache libc6-compat openssl

# 复制 package 文件
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# ========================================
# Stage 2: 构建阶段
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 OpenSSL（Prisma 运行时需要）
RUN apk add --no-cache openssl

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# 复制源代码
COPY . .

# 设置环境变量（构建时使用）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js 应用
RUN npm run build

# ========================================
# Stage 3: 生产运行阶段
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 安装 OpenSSL（Prisma 运行时需要）
RUN apk add --no-cache openssl

# 复制 Prisma 文件（运行时需要）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 复制公共资源
COPY --from=builder /app/public ./public

# 复制 Next.js 构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置端口
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
