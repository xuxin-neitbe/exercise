# -*- coding: utf-8 -*-
"""
三国狼人杀游戏配置文件
"""

import os
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量（覆盖系统环境变量）
load_dotenv(override=True)

# 通义千问 DashScope API 配置
class DashScopeConfig:
    """DashScope API 配置类"""
    
    # API Key（优先级：环境变量 > 配置文件）
    API_KEY = os.environ.get("DASHSCOPE_API_KEY", "sk-c224d6f0b2c440698429de0d95ada4fd")
    
    # 模型名称（优先级：环境变量 > 配置文件）
    MODEL_NAME = os.environ.get("DASHSCOPE_MODEL", "qwen3-vl-plus-2025-12-19")
    
    # API 端点（优先级：环境变量 > 配置文件）
    BASE_URL = os.environ.get(
        "DASHSCOPE_BASE_URL", 
        "https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    
    # 模型参数
    TEMPERATURE = 0.7
    MAX_TOKENS = 2000
    
    @classmethod
    def get_model_config(cls) -> dict:
        """获取模型配置字典"""
        return {
            "model_name": cls.MODEL_NAME,
            "api_key": cls.API_KEY,
            "base_url": cls.BASE_URL,
            "temperature": cls.TEMPERATURE,
            "max_tokens": cls.MAX_TOKENS,
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """验证配置是否有效"""
        if not cls.API_KEY or not cls.API_KEY.startswith("sk-"):
            return False
        if not cls.BASE_URL or not cls.BASE_URL.startswith("http"):
            return False
        return True


# 游戏配置
class GameConfig:
    """游戏配置类"""
    
    # 玩家数量
    DEFAULT_PLAYER_COUNT = 6
    
    # 最大游戏轮数
    MAX_GAME_ROUND = 10
    
    # 最大讨论轮数
    MAX_DISCUSSION_ROUND = 2
    
    # 是否启用详细日志
    VERBOSE_LOGGING = True


# 导出配置
__all__ = ["DashScopeConfig", "GameConfig"]
