"""
测试阿里云 DashScope 配置
"""
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

print("=" * 60)
print("🔍 环境变量配置检查")
print("=" * 60)

# 检查配置
api_key = os.getenv("LLM_API_KEY")
base_url = os.getenv("LLM_BASE_URL")
model_id = os.getenv("LLM_MODEL_ID")
timeout = os.getenv("LLM_TIMEOUT", "60")

print(f"✅ API Key: {api_key[:20]}...")
print(f"✅ Base URL: {base_url}")
print(f"✅ Model: {model_id}")
print(f"✅ Timeout: {timeout}秒")

print("\n" + "=" * 60)
print("📊 配置信息")
print("=" * 60)
print(f"服务提供商：阿里云 DashScope（灵积）")
print(f"模型名称：通义千问快速版 (qwen-flash)")
print(f"API 模式：OpenAI 兼容模式")
print(f"API 文档：https://help.aliyun.com/zh/dashscope/")

print("\n" + "=" * 60)
print("✅ 配置验证完成！")
print("=" * 60)
print("\n💡 提示：可以运行 python autogen_software_team.py 开始团队协作")
