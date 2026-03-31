"""
LangGraph 工作流系统 - 主入口

用法:
    python main.py                           # 基础工作流
    python main.py --human-in-loop          # 人机协同模式
    python main.py --workflow planner       # 指定工作流
    python main.py --thread-id task-123     # 指定线程 ID
"""

import argparse
import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from workflows.planner_executor import create_planner_executor_workflow
from workflows.human_in_loop import create_human_in_loop_workflow


def run_planner_executor_workflow(thread_id: str = "default"):
    """运行规划 - 执行 - 审查工作流"""
    print("🚀 启动规划 - 执行 - 审查工作流\n")
    
    # 创建工作流
    app = create_planner_executor_workflow()
    
    # 获取用户输入
    task = input("请输入任务描述：")
    
    if not task.strip():
        print("❌ 任务描述不能为空")
        return
    
    print(f"\n📋 任务：{task}\n")
    print("=" * 60)
    
    # 配置
    config = {"configurable": {"thread_id": thread_id}}
    
    # 运行工作流
    try:
        for event in app.stream({"task": task}, config=config, stream_mode="values"):
            print("\n📊 当前状态:")
            if "plan" in event and event["plan"]:
                print(f"  计划：{event['plan'][:100]}...")
            if "current_step" in event:
                print(f"  当前步骤：{event.get('current_step', 0)}/{len(event.get('steps', []))}")
            if "result" in event and event["result"]:
                print(f"  结果：{event['result'][:100]}...")
        
        print("\n" + "=" * 60)
        print("✅ 工作流执行完成！\n")
        
    except Exception as e:
        print(f"\n❌ 错误：{e}\n")


def run_human_in_loop_workflow(thread_id: str = "default"):
    """运行人机协同工作流"""
    print("🚀 启动人机协同工作流\n")
    
    # 创建工作流（带检查点和中断）
    app = create_human_in_loop_workflow()
    
    # 获取用户输入
    task = input("请输入任务描述：")
    
    if not task.strip():
        print("❌ 任务描述不能为空")
        return
    
    print(f"\n📋 任务：{task}\n")
    print("=" * 60)
    
    # 配置
    config = {"configurable": {"thread_id": thread_id}}
    
    try:
        # 运行到第一个中断点
        print("📌 运行到规划节点...\n")
        result = app.invoke({"task": task}, config=config)
        
        print(f"✅ 计划已制定：\n{result.get('plan', '无计划')}\n")
        
        # 人类审批
        print("-" * 60)
        approval = input("是否批准执行计划？(yes/no): ").strip().lower()
        
        if approval != "yes":
            print("❌ 计划未获批准，工作流终止")
            return
        
        print("-" * 60)
        print("✅ 计划已批准，继续执行...\n")
        
        # 继续执行（传入 None 表示从中断点继续）
        result = app.invoke(None, config=config)
        
        print(f"\n✅ 执行结果：{result.get('result', '无结果')}\n")
        print("=" * 60)
        print("🎉 人机协同工作流执行完成！\n")
        
    except Exception as e:
        print(f"\n❌ 错误：{e}\n")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='LangGraph 工作流系统')
    
    parser.add_argument(
        '--workflow',
        type=str,
        default='planner',
        choices=['planner', 'human', 'custom'],
        help='工作流类型'
    )
    
    parser.add_argument(
        '--human-in-loop',
        action='store_true',
        help='启用人机协同模式'
    )
    
    parser.add_argument(
        '--thread-id',
        type=str,
        default='default',
        help='线程 ID（用于状态持久化）'
    )
    
    args = parser.parse_args()
    
    # 检查 API Key
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ 错误：未找到 API Key")
        print("请设置环境变量：OPENAI_API_KEY 或 ANTHROPIC_API_KEY")
        print("或复制 .env.example 为 .env 并填写 API Key\n")
        return 1
    
    print(f"✓ API Key 已加载")
    print(f"📌 线程 ID: {args.thread_id}\n")
    
    # 选择工作流
    if args.human_in_loop or args.workflow == 'human':
        run_human_in_loop_workflow(args.thread_id)
    else:
        run_planner_executor_workflow(args.thread_id)
    
    return 0


if __name__ == '__main__':
    exit(main())
