"""
CAMEL 多 Agent 通信系统 - 主入口

用法:
    python main.py                           # 基础角色扮演
    python main.py --mode role-playing      # 角色扮演模式
    python main.py --mode data-generation   # 数据生成模式
    python main.py --assistant-role "Coder" # 指定助手角色
"""

import argparse
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from scenarios.role_playing import run_role_playing
from scenarios.data_generation import run_data_generation
from scenarios.task_automation import run_task_automation


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='CAMEL 多 Agent 通信系统')
    
    parser.add_argument(
        '--mode',
        type=str,
        default='role-playing',
        choices=['role-playing', 'data-generation', 'task-automation'],
        help='运行模式'
    )
    
    parser.add_argument(
        '--assistant-role',
        type=str,
        default='助手',
        help='助手角色名称'
    )
    
    parser.add_argument(
        '--user-role',
        type=str,
        default='用户',
        help='用户角色名称'
    )
    
    parser.add_argument(
        '--task',
        type=str,
        default=None,
        help='任务描述'
    )
    
    parser.add_argument(
        '--max-turns',
        type=int,
        default=10,
        help='最大对话轮数'
    )
    
    args = parser.parse_args()
    
    # 检查 API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ 错误：未找到 API Key")
        print("请设置环境变量：OPENAI_API_KEY")
        print("或复制 .env.example 为 .env 并填写 API Key\n")
        return 1
    
    print(f"✓ API Key 已加载")
    print(f"🎭 助手角色：{args.assistant_role}")
    print(f"👤 用户角色：{args.user_role}\n")
    
    # 选择运行模式
    if args.mode == 'role-playing':
        run_role_playing(
            assistant_role=args.assistant_role,
            user_role=args.user_role,
            task=args.task,
            max_turns=args.max_turns,
        )
    elif args.mode == 'data-generation':
        run_data_generation(
            assistant_role=args.assistant_role,
            max_turns=args.max_turns,
        )
    elif args.mode == 'task-automation':
        run_task_automation(
            assistant_role=args.assistant_role,
            task=args.task,
        )
    
    return 0


if __name__ == '__main__':
    exit(main())
