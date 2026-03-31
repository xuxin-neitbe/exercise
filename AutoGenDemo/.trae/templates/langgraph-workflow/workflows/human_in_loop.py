"""
人机协同工作流

特点：
- 在执行前设置中断点，等待人类审批
- 支持检查和修改状态
- 支持从中断点继续执行
"""

from typing import TypedDict, List
from langgraph.graph import StateGraph, START
from langgraph.checkpoint import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os


class State(TypedDict):
    """工作流状态"""
    task: str
    plan: str
    approved: bool
    result: str
    human_feedback: str


def create_planner_node(model_name: str = None):
    """创建规划节点"""
    
    model = ChatOpenAI(
        model=model_name or os.getenv("OPENAI_MODEL", "gpt-4"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7,
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个专业的规划师。你的任务是分析用户需求并制定详细的执行计划。"),
        ("user", "请分析以下任务并制定详细的执行计划：\n\n任务：{task}\n\n请提供：\n1. 任务分析\n2. 详细的执行计划\n3. 预期结果和可能的风险"),
    ])
    
    chain = prompt | model
    
    def planner_node(state: State):
        """规划节点"""
        task = state["task"]
        
        response = chain.invoke({"task": task})
        
        return {
            "plan": response.content,
            "approved": False,
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
        ("system", "你是一个高效的执行者。你的任务是按照批准的计划执行。"),
        ("user", "请按照以下计划执行任务：\n\n任务：{task}\n计划：{plan}\n人类反馈：{feedback}\n\n请执行任务并提供结果。"),
    ])
    
    chain = prompt | model
    
    def executor_node(state: State):
        """执行节点"""
        task = state["task"]
        plan = state["plan"]
        feedback = state.get("human_feedback", "无")
        
        response = chain.invoke({
            "task": task,
            "plan": plan,
            "feedback": feedback,
        })
        
        return {
            "result": response.content,
        }
    
    return executor_node


def create_human_approval_node():
    """创建人类审批节点（实际上是中断点）"""
    
    def human_approval_node(state: State):
        """人类审批节点"""
        # 这个节点实际上不会执行，只是作为中断点
        # 人类审批在 main.py 中通过输入完成
        return state
    
    return human_approval_node


def create_human_in_loop_workflow(model_name: str = None):
    """
    创建人机协同工作流
    
    Args:
        model_name: 模型名称
        
    Returns:
        编译后的 StateGraph（带检查点和中断）
    """
    # 创建节点
    planner = create_planner_node(model_name)
    executor = create_executor_node(model_name)
    human_approval = create_human_approval_node()
    
    # 创建状态图
    graph = StateGraph(State)
    
    # 添加节点
    graph.add_node("planner", planner)
    graph.add_node("human_approval", human_approval)
    graph.add_node("executor", executor)
    
    # 添加边
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "human_approval")
    graph.add_edge("human_approval", "executor")
    
    # 创建检查点保存器
    saver = MemorySaver()
    
    # 编译（设置中断点）
    # 在 human_approval 节点前中断，等待人类审批
    return graph.compile(
        checkpointer=saver,
        interrupt_before=["human_approval"]
    )
