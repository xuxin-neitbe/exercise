"""
任务自动化场景

使用多智能体协作完成复杂任务
"""

from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.messages import BaseMessage
import os


def run_task_automation(
    assistant_role: str = "任务执行者",
    task: str = None,
):
    """
    运行任务自动化场景
    
    Args:
        assistant_role: 助手角色名称
        task: 任务描述
    """
    print("⚙️ 启动任务自动化场景\n")
    print(f"助手角色：{assistant_role}")
    
    # 获取任务描述
    if not task:
        task = input("请输入任务描述：")
    
    print(f"\n📋 任务：{task}\n")
    print("=" * 60)
    
    # 创建模型
    model = ModelFactory.create(
        model_platform=ModelPlatformType.OPENAI,
        model_type=ModelType.GPT_4,
        api_key=os.getenv("OPENAI_API_KEY"),
        model_config_dict={"temperature": 0.3},
    )
    
    # 创建规划智能体
    planner_sys_msg = BaseMessage.make_assistant_message(
        role_name="规划师",
        content="你是专业的规划师，负责分析任务并制定详细的执行计划。"
    )
    
    planner = ChatAgent(
        system_message=planner_sys_msg,
        model=model,
    )
    
    # 创建执行智能体
    executor_sys_msg = BaseMessage.make_assistant_message(
        role_name=assistant_role,
        content=f"你是{assistant_role}，负责按照计划执行任务。"
    )
    
    executor = ChatAgent(
        system_message=executor_sys_msg,
        model=model,
    )
    
    # 创建审查智能体
    reviewer_sys_msg = BaseMessage.make_assistant_message(
        role_name="审查员",
        content="你是严格的审查员，负责检查任务执行结果。"
    )
    
    reviewer = ChatAgent(
        system_message=reviewer_sys_msg,
        model=model,
    )
    
    # 第 1 步：规划
    print("📝 第 1 步：制定计划\n")
    
    plan_msg = BaseMessage.make_user_message(
        role_name="User",
        content=f"请分析以下任务并制定详细的执行计划:\n\n任务：{task}"
    )
    
    plan_response = planner.step(plan_msg)
    plan = plan_response.msgs[0].content
    
    print(f"计划:\n{plan}\n")
    
    # 第 2 步：执行
    print("⚙️ 第 2 步：执行任务\n")
    
    exec_msg = BaseMessage.make_user_message(
        role_name="User",
        content=f"请按照以下计划执行任务:\n\n计划：{plan}\n\n任务：{task}"
    )
    
    exec_response = executor.step(exec_msg)
    result = exec_response.msgs[0].content
    
    print(f"执行结果:\n{result}\n")
    
    # 第 3 步：审查
    print("🔍 第 3 步：审查结果\n")
    
    review_msg = BaseMessage.make_user_message(
        role_name="User",
        content=f"请审查以下任务执行结果:\n\n任务：{task}\n计划：{plan}\n结果：{result}\n\n请评价执行质量并指出改进方向。"
    )
    
    review_response = reviewer.step(review_msg)
    review = review_response.msgs[0].content
    
    print(f"审查意见:\n{review}\n")
    
    print("=" * 60)
    print("🎉 任务自动化完成！\n")
    
    return {
        "task": task,
        "plan": plan,
        "result": result,
        "review": review,
    }
