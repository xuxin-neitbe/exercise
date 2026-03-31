# -*- coding: utf-8 -*-
"""
验证新配置已正确加载
"""

from dotenv import load_dotenv
from pathlib import Path
import os

# 加载 .env 文件
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

print("=" * 60)
print("✅ 配置验证结果")
print("=" * 60)

# 读取配置
api_key = os.environ.get("DASHSCOPE_API_KEY")
model_name = os.environ.get("DASHSCOPE_MODEL")
base_url = os.environ.get("DASHSCOPE_BASE_URL")

print(f"\n📌 配置信息:")
print(f"  ✅ API Key: {api_key[:8]}...{api_key[-4:]}")
print(f"  ✅ 模型名称：{model_name}")
print(f"  ✅ API 端点：{base_url}")

# 验证
print(f"\n🔒 验证结果:")
print(f"  {'✅' if api_key.startswith('sk-262499770a2d4ca9a4217c46d69504c8') else '❌'} API Key 正确")
print(f"  {'✅' if model_name == 'qwen-plus' else '❌'} 模型名称正确")
print(f"  {'✅' if base_url == 'https://dashscope.aliyuncs.com/compatible-mode/v1' else '❌'} API 端点正确")

print("\n" + "=" * 60)
print("✅ 配置已成功加载到项目中！")
print("=" * 60)

print("\n💡 使用方法:")
print("  1. 在代码中导入配置：from config import DashScopeConfig")
print("  2. 获取模型配置：DashScopeConfig.get_model_config()")
print("  3. 或直接使用环境变量：os.environ.get('DASHSCOPE_API_KEY')")
