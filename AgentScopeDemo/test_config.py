# -*- coding: utf-8 -*-
"""
验证配置文件是否正确加载
"""

from config import DashScopeConfig, GameConfig

def test_config():
    """测试配置加载"""
    print("=" * 60)
    print("🔧 三国狼人杀游戏配置验证")
    print("=" * 60)
    
    # 测试 DashScope 配置
    print("\n📌 通义千问 DashScope 配置:")
    print(f"  ✅ API Key: {DashScopeConfig.API_KEY[:8]}...{DashScopeConfig.API_KEY[-4:]}")
    print(f"  ✅ 模型名称：{DashScopeConfig.MODEL_NAME}")
    print(f"  ✅ API 端点：{DashScopeConfig.BASE_URL}")
    print(f"  ✅ 温度参数：{DashScopeConfig.TEMPERATURE}")
    print(f"  ✅ 最大 Token: {DashScopeConfig.MAX_TOKENS}")
    
    # 验证配置
    is_valid = DashScopeConfig.validate_config()
    print(f"\n  🔒 配置验证：{'✅ 有效' if is_valid else '❌ 无效'}")
    
    # 获取模型配置字典
    model_config = DashScopeConfig.get_model_config()
    print(f"\n📦 模型配置字典:")
    for key, value in model_config.items():
        if key == "api_key":
            print(f"  - {key}: {value[:8]}...{value[-4:]}")
        else:
            print(f"  - {key}: {value}")
    
    # 测试游戏配置
    print("\n📌 游戏配置:")
    print(f"  ✅ 默认玩家数量：{GameConfig.DEFAULT_PLAYER_COUNT}")
    print(f"  ✅ 最大游戏轮数：{GameConfig.MAX_GAME_ROUND}")
    print(f"  ✅ 最大讨论轮数：{GameConfig.MAX_DISCUSSION_ROUND}")
    print(f"  ✅ 详细日志：{GameConfig.VERBOSE_LOGGING}")
    
    print("\n" + "=" * 60)
    print("✅ 所有配置验证完成！")
    print("=" * 60)
    
    # 环境变量优先级测试
    print("\n💡 提示：")
    print("  - 配置文件中的配置会被环境变量覆盖")
    print("  - 可以通过设置 DASHSCOPE_API_KEY 环境变量来覆盖 API Key")
    print("  - 可以通过设置 DASHSCOPE_MODEL 环境变量来覆盖模型名称")
    print("  - 可以通过设置 DASHSCOPE_BASE_URL 环境变量来覆盖 API 端点")

if __name__ == "__main__":
    test_config()
