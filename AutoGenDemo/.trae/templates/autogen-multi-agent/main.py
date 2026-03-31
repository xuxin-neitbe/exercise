"""
AutoGen 多 Agent 协作系统 - 主入口

用法:
    python main.py --workflow code_review
    python main.py --workflow pair_programming
    python main.py --agents 3
"""

import asyncio
import argparse
import json
from pathlib import Path

from agents.coder_agent import CoderAgent
from agents.reviewer_agent import ReviewerAgent
from workflows.code_review import CodeReviewWorkflow
from workflows.pair_programming import PairProgrammingWorkflow


def load_config(config_path: str = "config/oai_config.json") -> dict:
    """加载 LLM 配置文件"""
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"配置文件不存在：{config_path}")
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def create_agents(config: dict, agent_count: int = 3):
    """创建 Agent 实例"""
    agents = []
    
    # 创建 Coder Agent
    if agent_count >= 1:
        coder = CoderAgent(config)
        agents.append(coder)
    
    # 创建 Reviewer Agent
    if agent_count >= 2:
        reviewer = ReviewerAgent(config)
        agents.append(reviewer)
    
    # TODO: 可以添加更多 Agent 角色
    # if agent_count >= 3:
    #     human = HumanAgent(config)
    #     agents.append(human)
    
    return agents


async def main_async():
    """异步主函数"""
    parser = argparse.ArgumentParser(description='AutoGen 多 Agent 协作系统')
    parser.add_argument(
        '--workflow',
        type=str,
        default='code_review',
        choices=['code_review', 'pair_programming'],
        help='工作流类型'
    )
    parser.add_argument(
        '--agents',
        type=int,
        default=3,
        help='Agent 数量'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='config/oai_config.json',
        help='配置文件路径'
    )
    
    args = parser.parse_args()
    
    # 加载配置
    print(f"加载配置文件：{args.config}")
    config = load_config(args.config)
    
    # 创建 Agent
    print(f"创建 {args.agents} 个 Agent...")
    agents = create_agents(config, args.agents)
    print(f"✓ 创建完成：{[type(a).__name__ for a in agents]}")
    
    # 选择并运行工作流
    print(f"启动工作流：{args.workflow}")
    
    try:
        if args.workflow == 'code_review':
            workflow = CodeReviewWorkflow(agents)
            await workflow.run_async()
        elif args.workflow == 'pair_programming':
            workflow = PairProgrammingWorkflow(agents)
            await workflow.run_async()
        else:
            print(f"未知的工作流类型：{args.workflow}")
            return 1
        
        print("✓ 工作流执行完成")
        return 0
    finally:
        # 清理资源
        for agent in agents:
            if hasattr(agent, 'close'):
                agent.close()


def main():
    """同步包装器"""
    return asyncio.run(main_async())


if __name__ == '__main__':
    exit(main())
