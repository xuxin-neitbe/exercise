FROM node:20-alpine

WORKDIR /app

# 安装 OpenSSL 和其他依赖
RUN apk add --no-cache openssl libc6-compat

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 使用项目安装的 prisma 版本生成 Client
RUN npm exec prisma -- generate

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 删除 devDependencies 减小镜像体积
RUN npm prune --production

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["npm", "start"]
