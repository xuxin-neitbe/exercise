# AgentScope 聊天机器人核心模块

from agentscope.agent import ReActAgent, UserAgent
from agentscope.model import DashScopeChatModel
from agentscope.memory import InMemoryMemory
from agentscope.formatter import DashScopeChatFormatter
from agentscope.tool import Toolkit
import os


def create_react_agent(
    name: str = "assistant",
    sys_prompt: str = "你是一个有帮助的助手。",
    model_name: str = None,
    api_key: str = None,
    enable_tools: bool = True,
):
    """
    创建 ReAct 智能体
    
    Args:
        name: 智能体名称
        sys_prompt: 系统提示词
        model_name: 模型名称
        api_key: API 密钥
        enable_tools: 是否启用工具
        
    Returns:
        ReActAgent 实例
    """
    # 使用环境变量或参数
    api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
    model_name = model_name or os.getenv("DASHSCOPE_MODEL", "qwen-max")
    
    # 创建模型实例
    model = DashScopeChatModel(
        model_name=model_name,
        api_key=api_key,
        stream=True,  # 启用流式响应
    )
    
    # 创建记忆模块
    memory = InMemoryMemory(
        capacity=20,  # 默认记忆容量
    )
    
    # 创建格式化工具
    formatter = DashScopeChatFormatter()
    
    # 创建工具包
    toolkit = None
    if enable_tools:
        toolkit = Toolkit()
        # 注册代码执行工具
        from agentscope.tool import execute_python_code
        toolkit.register_tool_function(execute_python_code)
        
        # 可选：注册 Shell 命令工具
        try:
            from agentscope.tool import execute_shell_command
            toolkit.register_tool_function(execute_shell_command)
        except ImportError:
            pass
        
        # 可选：注册网络搜索工具
        try:
            from agentscope.tool import SearchToolkit
            search_tool = SearchToolkit().search_duckduckgo
            toolkit.register_tool_function(search_tool)
        except ImportError:
            pass
    
    # 创建并返回 ReAct 智能体
    agent = ReActAgent(
        name=name,
        sys_prompt=sys_prompt,
        model=model,
        memory=memory,
        formatter=formatter,
        toolkit=toolkit,
    )
    
    return agent


def create_user_agent(name: str = "user"):
    """
    创建用户代理
    
    Args:
        name: 用户名称
        
    Returns:
        UserAgent 实例
    """
    return UserAgent(name=name)


async def chat_loop(agent, user=None):
    """
    运行对话循环
    
    Args:
        agent: ReActAgent 实例
        user: UserAgent 实例（可选）
    """
    if user is None:
        user = create_user_agent()
    
    msg = None
    print("🤖 AgentScope 聊天机器人已启动！输入 'exit' 退出。\n")
    
    while True:
        # Agent 响应
        msg = await agent(msg)
        
        # 检查是否应该退出
        if msg and msg.get_text_content():
            content = msg.get_text_content()
            if content.strip().lower() in ["exit", "quit", "退出"]:
                print("👋 再见！")
                break
        
        # 用户输入
        msg = await user(msg)
        
        # 检查用户是否要退出
        if msg and msg.get_text_content():
            content = msg.get_text_content()
            if content.strip().lower() in ["exit", "quit", "退出"]:
                print("👋 再见！")
                break


def run_chatbot():
    """
    运行聊天机器人（同步入口）
    """
    import asyncio
    
    # 创建 Agent
    agent = create_react_agent(
        name="assistant",
        sys_prompt="你是一个专业的助手，能够帮助用户完成各种任务。",
        enable_tools=True,
    )
    
    # 运行对话循环
    asyncio.run(chat_loop(agent))


if __name__ == "__main__":
    run_chatbot()
