import os
import json
from typing import List, Dict, Optional
from llm_client import HelloAgentsLLM
from dotenv import load_dotenv

# 加载环境变量
try:
    load_dotenv()
except Exception as e:
    print(f"警告：加载 .env 文件时出错：{e}")


# ==================== 1. 基础 Agent 类 ====================
class BaseAgent:
    """
    基础智能体类
    每个智能体都有独特的角色、背景和目标
    """

    def __init__(self, name: str, role: str, background: str, goal: str, llm_client: HelloAgentsLLM):
        self.name = name
        self.role = role
        self.background = background
        self.goal = goal
        self.llm_client = llm_client
        self.memory: List[Dict] = []  # 个人记忆

    def think(self, task: str, context: str = "") -> str:
        """
        智能体思考过程
        """
        system_prompt = f"""你是 {self.name}，{self.role}。
背景：{self.background}
目标：{self.goal}

请根据你的角色和专业领域，专业地完成任务。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{context}\n\n任务：{task}"}
        ]

        print(f"\n🤖 [{self.name}] 正在思考...")
        response = self.llm_client.think(messages=messages)
        
        # 保存到记忆
        self.memory.append({
            "task": task,
            "context": context,
            "response": response
        })
        
        return response

    def get_memory(self) -> List[Dict]:
        """获取记忆历史"""
        return self.memory

    def clear_memory(self):
        """清空记忆"""
        self.memory = []


# ==================== 2. 专业 Agent 角色定义 ====================
class ResearcherAgent(BaseAgent):
    """研究员 Agent - 负责信息收集和分析"""

    def __init__(self, llm_client: HelloAgentsLLM):
        super().__init__(
            name="Dr. Research",
            role="资深研究员",
            background="拥有 10 年研究经验，擅长信息收集、数据分析和事实核查",
            goal="提供准确、全面的研究结果",
            llm_client=llm_client
        )

    def research(self, topic: str) -> str:
        """执行研究任务"""
        task = f"""请对以下主题进行深入研究：
{topic}

请提供：
1. 核心概念解释
2. 关键事实和数据
3. 相关背景和上下文
4. 可能的争议点或不同观点"""
        
        return self.think(task)


class AnalystAgent(BaseAgent):
    """分析师 Agent - 负责深度分析和洞察"""

    def __init__(self, llm_client: HelloAgentsLLM):
        super().__init__(
            name="Prof. Analyst",
            role="首席分析师",
            background="擅长逻辑推理、模式识别和深度分析",
            goal="从数据中提取有价值的洞察和结论",
            llm_client=llm_client
        )

    def analyze(self, data: str, research_result: str) -> str:
        """执行分析任务"""
        task = f"""请基于以下研究结果进行深度分析：

研究数据：
{data}

研究结果：
{research_result}

请提供：
1. 关键发现和模式
2. 因果关系分析
3. 潜在影响和意义
4. 可能的风险和机会"""
        
        return self.think(task, context=f"研究数据：{data}")


class WriterAgent(BaseAgent):
    """作家 Agent - 负责内容创作和表达"""

    def __init__(self, llm_client: HelloAgentsLLM):
        super().__init__(
            name="Ms. Writer",
            role="专业作家",
            background="擅长清晰、生动地表达复杂概念",
            goal="创作高质量、易理解的内容",
            llm_client=llm_client
        )

    def write(self, topic: str, research: str, analysis: str) -> str:
        """执行写作任务"""
        task = f"""请基于以下材料创作一篇完整的内容：

主题：{topic}

研究结果：
{research}

分析结果：
{analysis}

请创作一篇结构清晰、逻辑严谨、语言生动的文章，包括：
1. 引人入胜的开头
2. 清晰的主体内容
3. 有力的结论"""
        
        return self.think(task, context=f"研究：{research}\n分析：{analysis}")


class CriticAgent(BaseAgent):
    """评审员 Agent - 负责质量审查和改进建议"""

    def __init__(self, llm_client: HelloAgentsLLM):
        super().__init__(
            name="Dr. Critic",
            role="高级评审员",
            background="以严格的标准和敏锐的洞察力著称",
            goal="确保输出质量，提供建设性改进建议",
            llm_client=llm_client
        )

    def review(self, content: str) -> str:
        """执行评审任务"""
        task = f"""请评审以下内容：

{content}

请从以下维度进行评估：
1. 准确性：信息是否准确无误？
2. 完整性：是否遗漏重要信息？
3. 逻辑性：论证是否严密？
4. 可读性：表达是否清晰？
5. 改进建议：具体如何改进？

请提供详细的评审意见和具体的改进建议。"""
        
        return self.think(task)


# ==================== 3. 协调器（Orchestrator） ====================
class MultiAgentOrchestrator:
    """
    多智能体协调器
    负责任务分解、Agent 调度和结果汇总
    """

    def __init__(self, llm_client: HelloAgentsLLM):
        self.llm_client = llm_client
        self.agents: Dict[str, BaseAgent] = {}
        self.shared_memory: List[Dict] = []  # 共享工作记忆

    def register_agent(self, name: str, agent: BaseAgent):
        """注册智能体"""
        self.agents[name] = agent
        print(f"✅ 智能体已注册：{name}")

    def add_to_shared_memory(self, entry: Dict):
        """添加到共享记忆"""
        self.shared_memory.append(entry)

    def get_shared_context(self) -> str:
        """获取共享上下文"""
        if not self.shared_memory:
            return "无"
        
        context = "协作历史：\n"
        for i, entry in enumerate(self.shared_memory, 1):
            context += f"{i}. [{entry.get('agent', 'Unknown')}] {entry.get('action', '')}: {entry.get('result', '')}\n"
        return context

    def execute_pipeline(self, topic: str) -> Dict:
        """
        执行流水线式协作
        Research → Analyze → Write → Review
        """
        print("\n" + "="*60)
        print("🚀 开始多智能体协作流程")
        print(f"主题：{topic}")
        print("="*60)

        # 步骤 1: 研究
        print("\n📚 阶段 1: 研究")
        researcher = self.agents.get("researcher")
        if not researcher:
            raise ValueError("未找到研究员 Agent")
        
        research_result = researcher.research(topic)
        self.add_to_shared_memory({
            "agent": "researcher",
            "action": "研究",
            "result": research_result[:200] + "..."
        })

        # 步骤 2: 分析
        print("\n🔍 阶段 2: 分析")
        analyst = self.agents.get("analyst")
        if not analyst:
            raise ValueError("未找到分析师 Agent")
        
        analysis_result = analyst.analyze(topic, research_result)
        self.add_to_shared_memory({
            "agent": "analyst",
            "action": "分析",
            "result": analysis_result[:200] + "..."
        })

        # 步骤 3: 写作
        print("\n✍️ 阶段 3: 写作")
        writer = self.agents.get("writer")
        if not writer:
            raise ValueError("未找到作家 Agent")
        
        content = writer.write(topic, research_result, analysis_result)
        self.add_to_shared_memory({
            "agent": "writer",
            "action": "写作",
            "result": content[:200] + "..."
        })

        # 步骤 4: 评审
        print("\n👀 阶段 4: 评审")
        critic = self.agents.get("critic")
        if not critic:
            raise ValueError("未找到评审员 Agent")
        
        review_result = critic.review(content)
        self.add_to_shared_memory({
            "agent": "critic",
            "action": "评审",
            "result": review_result[:200] + "..."
        })

        # 汇总结果
        final_result = {
            "topic": topic,
            "research": research_result,
            "analysis": analysis_result,
            "content": content,
            "review": review_result,
            "collaboration_log": self.shared_memory
        }

        print("\n" + "="*60)
        print("✅ 多智能体协作完成")
        print("="*60)

        return final_result

    def execute_parallel(self, topic: str) -> Dict:
        """
        执行并行式协作
        多个 Agent 同时工作，然后汇总
        """
        print("\n" + "="*60)
        print("🔄 开始并行多智能体协作")
        print(f"主题：{topic}")
        print("="*60)

        results = {}
        
        # 并行执行（实际中可真正的并行）
        for name, agent in self.agents.items():
            print(f"\n🤖 [{name}] 开始工作...")
            task = f"请从你的专业角度分析以下主题：{topic}"
            result = agent.think(task)
            results[name] = result
            self.add_to_shared_memory({
                "agent": name,
                "action": "并行分析",
                "result": result[:200] + "..."
            })

        # 汇总
        print("\n📊 汇总所有 Agent 的观点...")
        summary = self._synthesize_results(results)
        
        return {
            "topic": topic,
            "individual_results": results,
            "synthesis": summary,
            "collaboration_log": self.shared_memory
        }

    def _synthesize_results(self, results: Dict[str, str]) -> str:
        """综合多个 Agent 的结果"""
        synthesis_prompt = """请综合以下多个专家的观点，形成一个全面的结论：

"""
        for name, result in results.items():
            synthesis_prompt += f"\n[{name}] 的观点:\n{result}\n"
        
        synthesis_prompt += """
请：
1. 找出共同点和共识
2. 识别分歧和不同视角
3. 综合成一个全面的结论
4. 提出下一步建议"""

        messages = [{"role": "user", "content": synthesis_prompt}]
        print("🧠 正在综合所有观点...")
        return self.llm_client.think(messages=messages)

    def clear_memory(self):
        """清空共享记忆"""
        self.shared_memory = []


# ==================== 4. 主函数入口 ====================
if __name__ == "__main__":
    try:
        # 初始化 LLM 客户端
        llm_client = HelloAgentsLLM()

        # 创建协调器
        orchestrator = MultiAgentOrchestrator(llm_client)

        # 注册专业 Agent
        orchestrator.register_agent("researcher", ResearcherAgent(llm_client))
        orchestrator.register_agent("analyst", AnalystAgent(llm_client))
        orchestrator.register_agent("writer", WriterAgent(llm_client))
        orchestrator.register_agent("critic", CriticAgent(llm_client))

        # 执行任务
        topic = "人工智能对教育行业的影响"
        print(f"\n🎯 任务：{topic}")
        
        # 选择协作模式
        print("\n请选择协作模式:")
        print("1. 流水线式 (Research → Analyze → Write → Review)")
        print("2. 并行式 (所有 Agent 同时工作)")
        
        # 默认使用流水线式
        mode = "1"
        
        if mode == "1":
            result = orchestrator.execute_pipeline(topic)
            
            print("\n" + "="*60)
            print("📋 最终成果")
            print("="*60)
            print(f"\n主题：{result['topic']}")
            print(f"\n📝 创作内容:\n{result['content']}")
            print(f"\n👀 评审意见:\n{result['review']}")
        else:
            result = orchestrator.execute_parallel(topic)
            
            print("\n" + "="*60)
            print("📋 综合结论")
            print("="*60)
            print(f"\n主题：{result['topic']}")
            print(f"\n🔮 综合结论:\n{result['synthesis']}")

    except ValueError as e:
        print(f"❌ 错误：{e}")
    except Exception as e:
        print(f"❌ 未知错误：{e}")
