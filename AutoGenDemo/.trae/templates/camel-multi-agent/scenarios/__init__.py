"""
CAMEL 多 Agent 通信系统 - 场景模块

包含：
- 角色扮演场景
- 数据生成场景
- 任务自动化场景
"""

from scenarios.role_playing import run_role_playing
from scenarios.data_generation import run_data_generation
from scenarios.task_automation import run_task_automation

__all__ = [
    "run_role_playing",
    "run_data_generation",
    "run_task_automation",
]
