"""
规划 - 执行 - 审查工作流

流程：
1. Planner 分析任务并制定详细计划
2. Executor 按照计划逐步执行
3. Reviewer 审查执行结果
4. 如果未通过，返回 Executor 重新执行
5. 审查通过，输出最终结果
"""

from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os


class State(TypedDict):
    """工作流状态"""
    task: str
    plan: str
    steps: List[str]
    current_step: int
    current_result: str
    final_result: str
    messages: Annotated[List[str], add_messages]


def create_planner_node(model_name: str = None):
    """创建规划节点"""
    
    model = ChatOpenAI(
        model=model_name or os.getenv("OPENAI_MODEL", "gpt-4"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7,
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个专业的规划师。你的任务是分析用户需求并制定详细的执行计划。"),
        ("user", "请分析以下任务并制定详细的执行计划：\n\n任务：{task}\n\n请提供：\n1. 任务分析\n2. 详细的执行步骤（用列表形式）\n3. 预期结果"),
    ])
    
    chain = prompt | model
    
    def planner_node(state: State):
        """规划节点：分析任务并制定计划"""
        task = state["task"]
        
        # 调用 LLM 制定计划
        response = chain.invoke({"task": task})
        content = response.content
        
        # 简单的步骤提取（实际应用中应该更复杂）
        steps = []
        for line in content.split("\n"):
            if line.strip().startswith(("步骤", "Step", "-", "•", "1.", "2.", "3.")):
                steps.append(line.strip())
        
        # 如果没有提取到步骤，使用整个响应作为计划
        if not steps:
            steps = [content]
        
        return {
            "plan": content,
            "steps": steps,
            "current_step": 0,
        }
    
    return planner_node


def create_executor_node(model_name: str = None):
    """创建执行节点"""
    
    model = ChatOpenAI(
        model=model_name or os.getenv("OPENAI_MODEL", "gpt-4"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.3,
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个高效的执行者。你的任务是按照计划执行具体步骤。"),
        ("user", "请执行以下计划的当前步骤：\n\n计划：{plan}\n\n当前步骤：{step}\n\n之前结果：{previous_result}\n\n请执行当前步骤并提供结果。"),
    ])
    
    chain = prompt | model
    
    def executor_node(state: State):
        """执行节点：执行当前步骤"""
        current_step = state["current_step"]
        steps = state["steps"]
        plan = state["plan"]
        
        # 检查是否所有步骤都已完成
        if current_step >= len(steps):
            return {
                "final_result": "所有步骤已执行完成",
                "current_step": current_step,
            }
        
        # 获取当前步骤
        step = steps[current_step]
        previous_result = state.get("current_result", "")
        
        # 调用 LLM 执行步骤
        response = chain.invoke({
            "plan": plan,
            "step": step,
            "previous_result": previous_result,
        })
        
        return {
            "current_result": response.content,
            "current_step": current_step + 1,
        }
    
    return executor_node


def create_reviewer_node(model_name: str = None):
    """创建审查节点"""
    
    model = ChatOpenAI(
        model=model_name or os.getenv("OPENAI_MODEL", "gpt-4"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.3,
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是严格的审查员。你的任务是检查执行结果是否符合要求。"),
        ("user", "请审查以下执行结果：\n\n任务：{task}\n计划：{plan}\n当前结果：{result}\n\n请判断：\n1. 结果是否满足要求？\n2. 是否需要重新执行？\n3. 如果有问题，请指出。"),
    ])
    
    chain = prompt | model
    
    def reviewer_node(state: State):
        """审查节点：检查执行结果"""
        task = state["task"]
        plan = state["plan"]
        result = state.get("current_result", "")
        current_step = state["current_step"]
        steps = state["steps"]
        
        # 如果所有步骤都已完成，进行最终审查
        if current_step >= len(steps):
            return {
                "final_result": result,
            }
        
        # 调用 LLM 审查
        response = chain.invoke({
            "task": task,
            "plan": plan,
            "result": result,
        })
        
        content = response.content
        
        # 简单的通过判断（实际应用中应该更复杂）
        passed = "不满足" not in content and "需要重新" not in content
        
        if passed:
            return {
                "current_result": result,
                "messages": [f"步骤 {current_step} 审查通过"],
            }
        else:
            # 需要重新执行当前步骤
            return {
                "current_step": max(0, current_step - 1),  # 回退到上一步
                "messages": [f"步骤 {current_step} 审查未通过：{content}"],
            }
    
    return reviewer_node


def should_continue(state: State):
    """判断是否继续执行"""
    current_step = state["current_step"]
    steps = state["steps"]
    
    # 如果所有步骤都已完成，结束
    if current_step >= len(steps):
        return "end"
    
    # 否则继续执行
    return "continue"


def create_planner_executor_workflow(model_name: str = None):
    """
    创建规划 - 执行 - 审查工作流
    
    Args:
        model_name: 模型名称
        
    Returns:
        编译后的 StateGraph
    """
    # 创建节点
    planner = create_planner_node(model_name)
    executor = create_executor_node(model_name)
    reviewer = create_reviewer_node(model_name)
    
    # 创建状态图
    graph = StateGraph(State)
    
    # 添加节点
    graph.add_node("planner", planner)
    graph.add_node("executor", executor)
    graph.add_node("reviewer", reviewer)
    
    # 添加边
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "executor")
    graph.add_edge("executor", "reviewer")
    
    # 添加条件边
    graph.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "continue": "executor",
            "end": "__end__"
        }
    )
    
    # 编译
    return graph.compile()
