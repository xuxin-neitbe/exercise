#!/bin/bash
# ========================================
# 手动部署脚本
# 用于本地或服务器手动部署
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=========================================="
echo "Nexus Chat 部署脚本"
echo -e "==========================================${NC}"

# 检查环境
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: $1 未安装${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}检查依赖...${NC}"
check_command docker
check_command git

# 加载环境变量
if [ -f .env.production ]; then
    echo -e "${GREEN}加载生产环境配置...${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}错误: .env.production 文件不存在${NC}"
    exit 1
fi

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull origin main

# 构建镜像
echo -e "${YELLOW}构建 Docker 镜像...${NC}"
docker build -t nexus-chat:latest .

# 数据库迁移
echo -e "${YELLOW}执行数据库迁移...${NC}"
docker compose run --rm app npx prisma migrate deploy

# 重启服务
echo -e "${YELLOW}重启服务...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# 清理旧镜像
echo -e "${YELLOW}清理旧镜像...${NC}"
docker image prune -f

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker compose ps

# 健康检查
echo -e "${YELLOW}执行健康检查...${NC}"
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用健康检查通过${NC}"
else
    echo -e "${RED}✗ 应用健康检查失败${NC}"
fi

echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "==========================================${NC}"
