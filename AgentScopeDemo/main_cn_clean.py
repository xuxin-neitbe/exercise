# -*- coding: utf-8 -*-
"""
三国狼人杀 - 基于 AgentScope 的中文版狼人杀游戏
融合三国演义角色和传统狼人杀玩法

优化版本：减少调试输出，只显示关键游戏信息
"""
import asyncio
import os
import random
from typing import List, Dict, Optional

# 设置 AgentScope 日志级别，减少调试输出
import agentscope
agentscope.init(
    project="ThreeKingdomsWerewolf",
    name="game_run",
    save_dir="./runs",
    save_log=True,
    save_code=False,
    logger_level="ERROR"  # 只显示错误日志，不显示调试信息
)

from agentscope.agent import ReActAgent
from agentscope.model import DashScopeChatModel
from agentscope.pipeline import MsgHub, sequential_pipeline, fanout_pipeline
from agentscope.formatter import DashScopeMultiAgentFormatter

from prompt_cn import ChinesePrompts
from game_roles import GameRoles
from structured_output_cn import (
    DiscussionModelCN,
    get_vote_model_cn,
    WitchActionModelCN,
    get_seer_model_cn,
    get_hunter_model_cn,
    WerewolfKillModelCN
)
from utils_cn import (
    check_winning_cn,
    majority_vote_cn,
    get_chinese_name,
    format_player_list,
)


class ThreeKingdomsWerewolfGame:
    """三国狼人杀游戏类"""
    
    def __init__(self):
        self.players: List[ReActAgent] = []
        self.player_names: List[str] = []
        self.roles: Dict[str, str] = {}
        self.alive_players: List[str] = []
        self.werewolves: List[str] = []
        self.seer: Optional[str] = None
        self.witch: Optional[str] = None
        self.hunter: Optional[str] = None
        self.villagers: List[str] = []
        self.round_count = 0
        
    async def setup_game(self, player_count: int = 6):
        """设置游戏"""
        print("🎮 欢迎来到三国狼人杀！")
        print("🎮 开始设置三国狼人杀游戏...")
        
        # 获取角色分配
        roles = GameRoles.get_roles(player_count)
        
        # 创建玩家
        for role, character in zip(roles, GameRoles.get_characters(player_count)):
            player = await self.create_player(role, character)
            self.players.append(player)
            name = get_chinese_name(character)
            self.player_names.append(name)
            self.alive_players.append(name)
            
            # 记录角色信息
            self.roles[name] = role
            if role == "狼人":
                self.werewolves.append(name)
            elif role == "预言家":
                self.seer = name
            elif role == "女巫":
                self.witch = name
            elif role == "猎人":
                self.hunter = name
            else:
                self.villagers.append(name)
        
        print(f"✅ 游戏设置完成，共{len(self.players)}名玩家")
        
    async def create_player(self, role: str, character: str) -> ReActAgent:
        """创建具有三国背景的玩家"""
        name = get_chinese_name(character)
        self.roles[name] = role
        
        # 从环境变量读取配置
        api_key = os.environ.get("DASHSCOPE_API_KEY", "")
        model_name = os.environ.get("DASHSCOPE_MODEL", "qwen-flash")
        base_url = os.environ.get("DASHSCOPE_BASE_URL", None)
        
        # 创建模型配置
        model_kwargs = {
            "model_name": model_name,
            "api_key": api_key,
        }
        
        # 如果提供了自定义基础 URL，则使用兼容模式
        if base_url:
            model_kwargs["base_url"] = base_url
        
        agent = ReActAgent(
            name=name,
            sys_prompt=ChinesePrompts.get_role_prompt(role, character),
            model=DashScopeChatModel(**model_kwargs),
            formatter=DashScopeMultiAgentFormatter(),
        )
        
        return agent
    
    async def run_game(self):
        """运行游戏主循环"""
        print(f"\n📢 游戏开始！参与者：{', '.join(self.player_names)}")
        
        while True:
            self.round_count += 1
            print(f"\n🌙 === 第{self.round_count}轮游戏开始 ===")
            
            # 夜晚阶段
            await self.night_phase()
            
            # 检查游戏是否结束
            if check_winning_cn(self.werewolves, self.alive_players):
                break
            
            # 白天阶段
            await self.day_phase()
            
            # 检查游戏是否结束
            if check_winning_cn(self.werewolves, self.alive_players):
                break
    
    async def night_phase(self):
        """夜晚阶段"""
        print("🌙 第 1 夜降临，天黑请闭眼...")
        
        # 狼人行动
        await self.werewolf_night_action()
        
        # 预言家行动
        await self.seer_night_action()
        
        # 女巫行动
        await self.witch_night_action()
    
    async def werewolf_night_action(self):
        """狼人夜晚行动"""
        print("🐺 狼人请睁眼，选择今晚要击杀的目标...")
        
        async with MsgHub(
            participants=[p for p in self.players if get_chinese_name(p.name) in self.werewolves],
            enable_auto_broadcast=True
        ) as hub:
            # 狼人讨论
            for wolf in self.players:
                if get_chinese_name(wolf.name) in self.werewolves:
                    await wolf(structured_model=WerewolfKillModelCN)
    
    async def seer_night_action(self):
        """预言家夜晚行动"""
        if self.seer and self.seer in self.alive_players:
            print("🔮 预言家请睁眼，选择要查验的玩家...")
            
            seer_agent = next(p for p in self.players if p.name == self.seer)
            
            # 预言家查验
            await seer_agent(
                structured_model=get_seer_model_cn(self.alive_players)
            )
    
    async def witch_night_action(self):
        """女巫夜晚行动"""
        if self.witch and self.witch in self.alive_players:
            print("🧙‍♀️ 女巫请睁眼...")
            
            witch_agent = next(p for p in self.players if p.name == self.witch)
            
            # 女巫行动
            await witch_agent(structured_model=WitchActionModelCN)
    
    async def day_phase(self):
        """白天阶段"""
        print("☀️ 天亮了，请大家睁眼...")
        
        # 公布夜晚结果
        print("📢 现在开始自由讨论。存活玩家：{}".format(', '.join(self.alive_players)))
        
        # 所有存活玩家讨论
        discussion_players = [p for p in self.players if p.name in self.alive_players]
        
        async with MsgHub(
            participants=discussion_players,
            enable_auto_broadcast=True
        ) as hub:
            for player in discussion_players:
                await player(structured_model=DiscussionModelCN)
        
        # 投票阶段
        await self.voting_phase()
    
    async def voting_phase(self):
        """投票阶段"""
        print("📢 请投票选择要淘汰的玩家")
        
        # 所有存活玩家投票
        vote_players = [p for p in self.players if p.name in self.alive_players]
        
        # 使用并发管道收集投票
        vote_msgs = await fanout_pipeline(
            vote_players,
            msg=None,
            structured_model=get_vote_model_cn(self.alive_players),
            enable_gather=False,
        )
        
        # 统计投票结果
        eliminated = majority_vote_cn(vote_msgs, self.alive_players)
        
        if eliminated:
            print(f"📢 投票结果：{eliminated}以 3 票被淘汰出局。")
            self.alive_players.remove(eliminated)
            
            # 检查猎人技能
            if eliminated == self.hunter:
                await self.hunter_action()
    
    async def hunter_action(self):
        """猎人技能"""
        if self.hunter and self.hunter in self.alive_players:
            print("🏹 猎人被投票出局，可以开枪带走一名玩家...")
            
            hunter_agent = next(p for p in self.players if p.name == self.hunter)
            
            # 猎人开枪
            await hunter_agent(
                structured_model=get_hunter_model_cn(self.alive_players)
            )


async def main():
    """主函数"""
    # 检查 API Key
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        print("❌ 错误：未找到 API Key")
        print("请设置环境变量：DASHSCOPE_API_KEY")
        print("或复制 .env.example 为 .env 并填写 API Key\n")
        return
    
    print(f"✅ API Key 已加载")
    print(f"✅ 使用模型：{os.environ.get('DASHSCOPE_MODEL', 'qwen-flash')}")
    
    # 创建游戏实例
    game = ThreeKingdomsWerewolfGame()
    
    # 设置游戏
    await game.setup_game(player_count=6)
    
    # 运行游戏
    await game.run_game()
    
    print("\n🎉 感谢游玩三国狼人杀！")


if __name__ == "__main__":
    asyncio.run(main())
