"""
LLM 辅助函数

提供常用的 LLM 配置和辅助功能
"""

import json
from pathlib import Path
from typing import Dict, List


def load_config(config_path: str = "config/oai_config.json") -> Dict:
    """
    加载 LLM 配置文件
    
    Args:
        config_path: 配置文件路径
        
    Returns:
        配置字典
    """
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"配置文件不存在：{config_path}")
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_config(config: Dict, config_path: str = "config/oai_config.json"):
    """
    保存 LLM 配置文件
    
    Args:
        config: 配置字典
        config_path: 配置文件路径
    """
    config_file = Path(config_path)
    config_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def create_config_from_env(
    model: str = "gpt-4",
    api_key: str = None,
    api_base: str = None,
    timeout: int = 300
) -> Dict:
    """
    从环境变量创建配置
    
    Args:
        model: 模型名称
        api_key: API 密钥
        api_base: API 基础 URL
        timeout: 超时时间（秒）
        
    Returns:
        配置字典
    """
    import os
    
    if not api_key:
        api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_base:
        api_base = os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1')
    
    config = {
        "config_list": [
            {
                "model": model,
                "api_key": api_key,
                "base_url": api_base
            }
        ],
        "timeout": timeout,
        "temperature": 0.7,
        "cache_seed": 42,
        "use_cache": True
    }
    
    return config


def validate_config(config: Dict) -> bool:
    """
    验证配置是否有效
    
    Args:
        config: 配置字典
        
    Returns:
        是否有效
    """
    # 检查必需字段
    if 'config_list' not in config:
        return False
    
    if not config['config_list']:
        return False
    
    # 检查第一个配置
    first_config = config['config_list'][0]
    if 'model' not in first_config:
        return False
    
    if 'api_key' not in first_config and 'base_url' not in first_config:
        return False
    
    return True


def get_model_info(model: str) -> Dict:
    """
    获取模型信息
    
    Args:
        model: 模型名称
        
    Returns:
        模型信息字典
    """
    model_info = {
        'gpt-4': {
            'context_window': 8192,
            'max_tokens': 8192,
            'cost_per_1k_input': 0.03,
            'cost_per_1k_output': 0.06
        },
        'gpt-4-turbo': {
            'context_window': 128000,
            'max_tokens': 4096,
            'cost_per_1k_input': 0.01,
            'cost_per_1k_output': 0.03
        },
        'gpt-3.5-turbo': {
            'context_window': 16385,
            'max_tokens': 4096,
            'cost_per_1k_input': 0.0005,
            'cost_per_1k_output': 0.0015
        }
    }
    
    return model_info.get(model, {
        'context_window': 'unknown',
        'max_tokens': 'unknown',
        'cost_per_1k_input': 'unknown',
        'cost_per_1k_output': 'unknown'
    })


def estimate_cost(tokens: int, model: str = "gpt-4") -> float:
    """
    估算 LLM 调用成本
    
    Args:
        tokens: 使用的 token 数量
        model: 模型名称
        
    Returns:
        估算成本（美元）
    """
    info = get_model_info(model)
    
    if info['cost_per_1k_input'] == 'unknown':
        return 0.0
    
    cost = (tokens / 1000) * info['cost_per_1k_input']
    return round(cost, 4)
