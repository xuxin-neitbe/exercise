#!/usr/bin/env python
"""测试混合运算"""

# 先加载环境变量（使用绝对路径）
try:
    from dotenv import load_dotenv
    from pathlib import Path
    
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from agent import CalculatorAgent

# 使用环境变量配置
agent = CalculatorAgent()

test_cases = [
    "4+6*7/5",
    "5 加 3",
    "10 除以 2",
    "2+3*4",
    "100-50/2+10",
    "1+2+3+4",
]

for query in test_cases:
    print(f"\n{'='*60}")
    print(f"问题：{query}")
    print(f"{'='*60}")
    result = agent.process_query(query)
    print(f"结果：{result}")
    agent.clear_history()
