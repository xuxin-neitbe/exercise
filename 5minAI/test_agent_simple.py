"""
简化版 Agent 测试 - 用于排查问题
"""
import os
import re
from tools import TOOLS, debug_log
from llm_client import OpenAICompatibleClient

# Agent 系统提示词
AGENT_SYSTEM_PROMPT = """
你是一个智能旅行助手。你的任务是分析用户的请求，并使用可用工具一步步地解决问题。

# 可用工具:
- `get_weather(city: str)`: 查询指定城市的实时天气。
- `get_attraction(city: str, weather: str)`: 根据城市和天气搜索推荐的旅游景点。

# 输出格式要求:
你的每次回复必须严格遵循以下格式，包含一对 Thought 和 Action：
Thought: [你的思考过程和下一步计划]
Action: [你要执行的具体行动]

Action 的格式必须是以下之一：
1. 调用工具：function_name(arg_name="arg_value")
2. 结束任务：Finish[最终答案]

# 重要提示:
- 每次只输出一对 Thought-Action
- Action 必须在同一行，不要换行
- 当收集到足够信息可以回答用户问题时，必须使用 Action: Finish[最终答案] 格式结束

请开始吧！
"""

def test_simple_agent():
    """简化版 Agent 测试"""
    print("=" * 60)
    print("简化版 Agent 测试")
    print("=" * 60)
    
    # 配置
    API_KEY = "sk-908dc71a548f48e4a0ed9b0a70b138a0"
    BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    MODEL_ID = "qwen-flash"
    
    # 配置 Tavily API
    TAVILY_API_KEY = "YOUR_TAVILY_API_KEY"
    os.environ['TAVILY_API_KEY'] = TAVILY_API_KEY
    
    # 初始化 LLM
    llm = OpenAICompatibleClient(
        model=MODEL_ID,
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    # 测试用户输入
    user_prompt = "你好，请帮我查询一下今天北京的天气"
    prompt_history = [f"用户请求：{user_prompt}"]
    
    print(f"\n用户输入：{user_prompt}")
    print("=" * 60)
    
    # 第一次循环 - 只测试天气查询
    print("\n【循环 1】")
    full_prompt = "\n".join(prompt_history)
    
    print("正在调用 LLM...")
    llm_output = llm.generate(full_prompt, system_prompt=AGENT_SYSTEM_PROMPT)
    
    print(f"\nLLM 输出:\n{llm_output}")
    print("=" * 60)
    
    # 解析 Action
    action_match = re.search(r"Action: (.*)", llm_output, re.DOTALL)
    
    if action_match:
        action_str = action_match.group(1).strip()
        print(f"解析到的 Action: {action_str}")
        
        if "get_weather" in action_str:
            print("\n检测到天气查询工具，正在执行...")
            tool_name = re.search(r"(\w+)\(", action_str).group(1)
            args_str = re.search(r"\((.*)\)", action_str).group(1)
            kwargs = dict(re.findall(r'(\w+)="([^"]*)"', args_str))
            
            print(f"工具名称：{tool_name}")
            print(f"参数：{kwargs}")
            
            # 执行工具
            observation = TOOLS[tool_name](**kwargs)
            print(f"\n工具返回结果:\n{observation}")
        else:
            print("未检测到天气查询工具")
    else:
        print("❌ 未能解析到 Action")

if __name__ == "__main__":
    test_simple_agent()
