# -*- coding: utf-8 -*-
"""
使用新配置测试 Qwen-Plus 模型
"""

from config import DashScopeConfig
from agentscope.model import DashScopeChatModel

def test_new_config():
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
        return
    
    print("\n✅ 配置验证通过！")
    
    # 创建模型实例
    print("\n📦 创建模型实例...")
    model = DashScopeChatModel(
        model_name=DashScopeConfig.MODEL_NAME,
        api_key=DashScopeConfig.API_KEY,
        base_url=DashScopeConfig.BASE_URL,
        temperature=DashScopeConfig.TEMPERATURE,
        max_tokens=DashScopeConfig.MAX_TOKENS,
    )
    
    # 测试模型
    print("\n💬 发送测试消息...")
    response = model(messages=[{"role": "user", "content": "你好，请用一句话介绍你自己。"}])
    
    print("\n✅ 模型响应:")
    print(f"  {response.text}")
    
    print("\n" + "=" * 60)
    print("✅ 新配置测试成功！")
    print("=" * 60)

if __name__ == "__main__":
    test_new_config()
