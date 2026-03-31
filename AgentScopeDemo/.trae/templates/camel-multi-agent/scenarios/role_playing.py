"""
角色扮演场景

两个智能体扮演不同角色进行对话协作：
- AI User：提出需求和问题
- AI Assistant：协助完成任务
"""

from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.messages import BaseMessage
import os


def run_role_playing(
    assistant_role: str = "助手",
    user_role: str = "用户",
    task: str = None,
    max_turns: int = 10,
):
    """
    运行角色扮演场景
    
    Args:
        assistant_role: 助手角色名称
        user_role: 用户角色名称
        task: 任务描述
        max_turns: 最大对话轮数
    """
    print("🎭 启动角色扮演场景\n")
    print(f"助手角色：{assistant_role}")
    print(f"用户角色：{user_role}")
    print(f"最大轮数：{max_turns}\n")
    
    # 创建模型
    model = ModelFactory.create(
        model_platform=ModelPlatformType.OPENAI,
        model_type=ModelType.GPT_4,
        api_key=os.getenv("OPENAI_API_KEY"),
        model_config_dict={"temperature": 0.7},
    )
    
    # 创建系统消息
    assistant_sys_msg = BaseMessage.make_assistant_message(
        role_name=assistant_role,
        content=f"你是一个专业的{assistant_role}，负责协助用户完成任务。"
    )
    
    user_sys_msg = BaseMessage.make_user_message(
        role_name=user_role,
        content=f"你是一个{user_role}，负责提出需求和任务。"
    )
    
    # 创建智能体
    assistant_agent = ChatAgent(
        system_message=assistant_sys_msg,
        model=model,
    )
    
    user_agent = ChatAgent(
        system_message=user_sys_msg,
        model=model,
    )
    
    # 获取任务描述
    if not task:
        task = input(f"请{user_role}输入任务描述：")
    
    print(f"\n📋 任务：{task}\n")
    print("=" * 60)
    
    # 创建初始消息
    user_msg = BaseMessage.make_user_message(
        role_name=user_role,
        content=task,
    )
    
    # 开始对话
    turn = 0
    chat_history = []
    
    while turn < max_turns:
        turn += 1
        print(f"\n🔄 第 {turn} 轮对话\n")
        
        # 助手响应
        assistant_response = assistant_agent.step(user_msg)
        assistant_content = assistant_response.msgs[0].content
        
        print(f"{assistant_role}:\n{assistant_content}\n")
        chat_history.append({
            "role": assistant_role,
            "content": assistant_content,
        })
        
        # 检查是否终止
        if assistant_response.terminated:
            print("💬 对话已自然终止\n")
            break
        
        # 用户响应
        user_response = user_agent.step(assistant_response.msgs[0])
        user_content = user_response.msgs[0].content
        
        print(f"{user_role}:\n{user_content}\n")
        chat_history.append({
            "role": user_role,
            "content": user_content,
        })
        
        # 检查是否终止
        if user_response.terminated:
            print("💬 对话已自然终止\n")
            break
        
        # 更新消息
        user_msg = user_response.msgs[0]
        
        # 检查是否应该结束
        if turn >= max_turns:
            print(f"⏰ 已达到最大轮数 {max_turns}\n")
            break
    
    # 输出总结
    print("=" * 60)
    print("🎉 角色扮演完成！")
    print(f"总轮数：{turn}")
    print(f"对话历史：{len(chat_history)} 条\n")
    
    return chat_history
