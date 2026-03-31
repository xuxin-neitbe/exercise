"""
AgentScope 聊天机器人 - 主入口

用法:
    python main.py                    # 基础聊天
    python main.py --with-tools      # 带工具调用
    python main.py --multi-agent     # 多智能体模式
    python main.py --model qwen-plus # 指定模型
"""

import argparse
import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from agents import create_react_agent, create_user_agent, chat_loop


async def run_multi_agent_mode():
    """运行多智能体协作模式"""
    print("🚀 启动多智能体协作模式\n")
    
    # 创建多个专业 Agent
    coder_agent = create_react_agent(
        name="coder",
        sys_prompt="你是专业的 Python 程序员，负责编写高质量代码。",
        enable_tools=True,
    )
    
    reviewer_agent = create_react_agent(
        name="reviewer",
        sys_prompt="你是严格的代码审查员，负责发现代码问题并提供改进建议。",
        enable_tools=False,
    )
    
    user = create_user_agent()
    
    print("💡 提示：输入代码需求，Coder 和 Reviewer 将协作完成。\n")
    
    # 简单的轮询对话
    msg = None
    while True:
        # 用户输入
        msg = await user(msg)
        
        if msg and msg.get_text_content():
            content = msg.get_text_content()
            if content.strip().lower() in ["exit", "quit", "退出"]:
                print("👋 再见！")
                break
        
        # Coder 处理
        msg = await coder_agent(msg)
        
        # Reviewer 审查
        msg = await reviewer_agent(msg)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='AgentScope 聊天机器人')
    
    parser.add_argument(
        '--with-tools',
        action='store_true',
        help='启用工具调用功能'
    )
    
    parser.add_argument(
        '--multi-agent',
        action='store_true',
        help='启用多智能体协作模式'
    )
    
    parser.add_argument(
        '--model',
        type=str,
        default=None,
        help='指定模型名称（如：qwen-max, qwen-plus）'
    )
    
    parser.add_argument(
        '--sys-prompt',
        type=str,
        default=None,
        help='自定义系统提示词'
    )
    
    args = parser.parse_args()
    
    # 检查 API Key
    api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ 错误：未找到 API Key")
        print("请设置环境变量：DASHSCOPE_API_KEY 或 OPENAI_API_KEY")
        print("或复制 .env.example 为 .env 并填写 API Key\n")
        return 1
    
    print(f"✓ API Key 已加载")
    
    # 多智能体模式
    if args.multi_agent:
        asyncio.run(run_multi_agent_mode())
        return 0
    
    # 单智能体模式
    print("🚀 启动 AgentScope 聊天机器人\n")
    
    agent = create_react_agent(
        name="assistant",
        sys_prompt=args.sys_prompt or "你是一个专业的助手，能够帮助用户完成各种任务。",
        model_name=args.model,
        enable_tools=args.with_tools,
    )
    
    # 运行对话循环
    asyncio.run(chat_loop(agent))
    
    return 0


if __name__ == '__main__':
    exit(main())
