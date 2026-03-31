#!/bin/bash
# ========================================
# 阿里云 ECS 服务器初始化脚本
# 在新服务器上运行此脚本
# ========================================

set -e

echo "=========================================="
echo "开始初始化阿里云 ECS 服务器..."
echo "=========================================="

# 更新系统
echo "[1/6] 更新系统包..."
yum update -y || apt update -y

# 安装 Docker
echo "[2/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 安装 Docker Compose
echo "[3/6] 安装 Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 安装 Git
echo "[4/6] 安装 Git..."
if ! command -v git &> /dev/null; then
    yum install -y git || apt install -y git
fi

# 创建项目目录
echo "[5/6] 创建项目目录..."
mkdir -p /opt/nexus-chat
cd /opt/nexus-chat

# 克隆代码仓库（需要先配置 SSH Key 或使用 HTTPS）
echo "[6/6] 克隆代码仓库..."
if [ ! -d ".git" ]; then
    git clone https://github.com/your-username/nexus-chat.git .
fi

# 创建环境变量文件
echo "创建环境变量文件..."
cat > .env.production << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://nexus:your_secure_password@postgres:5432/nexus_chat

# NextAuth 配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key-at-least-32-characters

# Socket.io 配置
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com:3002

# AI API Keys
ALIBABA_API_KEY=your_alibaba_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
AI_PROVIDER=alibaba
AI_MODEL=qwen-plus

# PostgreSQL 配置
POSTGRES_USER=nexus
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=nexus_chat

# Redis 配置
REDIS_PASSWORD=your_redis_password
EOF

echo "=========================================="
echo "初始化完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 编辑 /opt/nexus-chat/.env.production 填写真实配置"
echo "2. 登录阿里云容器镜像服务: docker login registry.cn-hangzhou.aliyuncs.com"
echo "3. 启动服务: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
