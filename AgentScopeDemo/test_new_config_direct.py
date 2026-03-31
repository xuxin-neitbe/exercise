# -*- coding: utf-8 -*-
"""
直接加载 .env 文件测试新配置
"""

import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# 显式加载 .env 文件
env_path = Path(__file__).parent / ".env"
print(f"📂 正在加载 .env 文件：{env_path}")
load_dotenv(dotenv_path=env_path)

# 现在导入配置
from config import DashScopeConfig

async def test_new_config():
    """使用新配置测试模型"""
    print("=" * 60)
    print("🚀 测试新配置的 Qwen-Plus 模型")
    print("=" * 60)
    
    # 显示配置
    print("\n📌 当前配置:")
    print(f"  API Key: {DashScopeConfig.API_KEY[:8]}...{DashScopeConfig.API_KEY[-4:]}")
    print(f"  模型：{DashScopeConfig.MODEL_NAME}")
    print(f"  端点：{DashScopeConfig.BASE_URL}")
    
    # 验证配置
    if not DashScopeConfig.validate_config():
        print("\n❌ 配置验证失败！")
        print(f"  API Key 有效：{DashScopeConfig.API_KEY.startswith('sk-')}")
        print(f"  Base URL 有效：{DashScopeConfig.BASE_URL.startswith('http')}")
        return
    
    print("\n✅ 配置验证通过！")
    
    # 创建模型实例
    print("\n📦 创建模型实例...")
    from agentscope.model import DashScopeChatModel
    
    model = DashScopeChatModel(
        model_name=DashScopeConfig.MODEL_NAME,
        api_key=DashScopeConfig.API_KEY,
        base_url=DashScopeConfig.BASE_URL,
        temperature=DashScopeConfig.TEMPERATURE,
        max_tokens=DashScopeConfig.MAX_TOKENS,
    )
    
    # 测试模型
    print("\n💬 发送测试消息...")
    response = await model(messages=[{"role": "user", "content": "你好，请用一句话介绍你自己。"}])
    
    print("\n✅ 模型响应:")
    print(f"  {response.text}")
    
    print("\n" + "=" * 60)
    print("✅ 新配置测试成功！")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_new_config())
