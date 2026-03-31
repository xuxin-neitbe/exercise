# Python 多阶段构建
FROM python:{{PYTHON_VERSION}}-slim AS builder

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 生产阶段
FROM python:{{PYTHON_VERSION}}-slim

WORKDIR /app

# 从构建阶段复制依赖
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app .

# 复制源代码
COPY . .

# 添加到 PATH
ENV PATH=/root/.local/bin:$PATH

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# 启动应用
CMD ["python", "main.py"]
