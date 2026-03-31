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


def run_agent(user_prompt: str, max_iterations: int = 5):
    """
    运行 Agent 主循环
    
    参数:
        user_prompt (str): 用户输入的请求
        max_iterations (int): 最大循环次数，防止无限循环
    """
    debug_log("Agent", "\n" + "=" * 60)
    debug_log("Agent", "========== Agent 启动 ==========")
    debug_log("Agent", "=" * 60)
    
    # --- 1. 配置 LLM 客户端 ---
    debug_log("Agent", "\n【阶段 1】配置 LLM 客户端")
    API_KEY = "sk-908dc71a548f48e4a0ed9b0a70b138a0"
    BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 阿里云百炼（通义千问）API 端点
    MODEL_ID = "qwen-flash"
    
    # 配置阿里云天气 API
    ALIYUN_WEATHER_APCODE = "8d3f117a76ff48508b566c5d31bead3e"
    os.environ['ALIYUN_WEATHER_APCODE'] = ALIYUN_WEATHER_APCODE
    
    # 配置 Tavily API 密钥
    TAVILY_API_KEY = "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"
    debug_log("Agent", f"正在设置环境变量 TAVILY_API_KEY...")
    os.environ['TAVILY_API_KEY'] = TAVILY_API_KEY
    debug_log("Agent", f"✓ 环境变量设置完成\n")
    
    # 初始化 LLM 客户端
    llm = OpenAICompatibleClient(
        model=MODEL_ID,
        api_key=API_KEY,
        base_url=BASE_URL
    )
    
    # --- 2. 初始化 ---
    debug_log("Agent", "\n【阶段 2】初始化 Agent")
    prompt_history = [f"用户请求：{user_prompt}"]
    debug_log("Agent", f"初始 prompt_history: {prompt_history}")
    debug_log("Agent", f"最大循环次数：{max_iterations}")
    
    print(f"用户输入：{user_prompt}\n" + "=" * 40)
    debug_log("Agent", f"用户输入长度：{len(user_prompt)} 字符\n")
    
    # --- 3. 运行主循环 ---
    debug_log("Agent", "\n【阶段 3】开始主循环")
    for i in range(max_iterations):
        debug_log("Agent", f"\n{'='*60}")
        debug_log("Agent", f"【循环 {i + 1}/{max_iterations}】开始")
        debug_log("Agent", f"{'='*60}")
        print(f"--- 循环 {i + 1} ---\n")
        
        # 3.1. 构建 Prompt（累积历史对话）
        debug_log("Agent", f"步骤 3.1: 构建 Prompt")
        full_prompt = "\n".join(prompt_history)
        debug_log("Agent", f"当前 prompt_history 长度：{len(prompt_history)}")
        debug_log("Agent", f"构建后的 full_prompt 长度：{len(full_prompt)} 字符")
        
        # 3.2. 调用 LLM 进行思考
        debug_log("Agent", f"步骤 3.2: 调用 LLM 进行思考")
        llm_output = llm.generate(full_prompt, system_prompt=AGENT_SYSTEM_PROMPT)
        debug_log("Agent", f"LLM 输出长度：{len(llm_output) if llm_output else 0} 字符")
        
        # 模型可能会输出多余的 Thought-Action，需要截断
        debug_log("Agent", f"步骤 3.2.1: 检查并截断多余的 Thought-Action 对")
        match = re.search(
            r'(Thought:.*?Action:.*?)(?=\n\s*(?:Thought:|Action:|Observation:)|\Z)',
            llm_output,
            re.DOTALL
        )
        if match:
            debug_log("Agent", "✓ 正则匹配成功")
            truncated = match.group(1).strip()
            if truncated != llm_output.strip():
                debug_log("Agent", "检测到多余的 Thought-Action 对，正在截断...")
                llm_output = truncated
                print("已截断多余的 Thought-Action 对")
                debug_log("Agent", f"截断后的输出长度：{len(llm_output)} 字符")
            else:
                debug_log("Agent", "✓ 输出格式正确，无需截断")
        else:
            debug_log("Agent", "⚠️ 正则匹配失败，可能格式不正确")
        
        debug_log("Agent", f"\n【LLM 输出内容】")
        debug_log("Agent", f"{llm_output}")
        debug_log("Agent", f"【LLM 输出结束】\n")
        
        print(f"模型输出:\n{llm_output}\n")
        prompt_history.append(llm_output)
        debug_log("Agent", f"已将 LLM 输出添加到 prompt_history")
        
        # 3.3. 解析并执行行动
        debug_log("Agent", f"步骤 3.3: 解析并执行 Action")
        action_match = re.search(r"Action: (.*)", llm_output, re.DOTALL)
        
        if not action_match:
            # 未能解析到 Action 字段
            debug_log("Agent", "❌ 未能解析到 Action 字段")
            observation = "错误：未能解析到 Action 字段。请确保你的回复严格遵循 'Thought: ... Action: ...' 的格式。"
            observation_str = f"Observation: {observation}"
            print(f"{observation_str}\n" + "=" * 40)
            prompt_history.append(observation_str)
            debug_log("Agent", f"已将错误观察结果添加到 prompt_history，继续下一次循环")
            continue
        
        action_str = action_match.group(1).strip()
        debug_log("Agent", f"✓ 成功解析 Action: {action_str}")
        
        # 检查是否是结束任务
        if action_str.startswith("Finish"):
            debug_log("Agent", f"✓ 检测到 Finish 标记，任务即将完成")
            final_answer = re.match(r"Finish\[(.*)\]", action_str).group(1)
            debug_log("Agent", f"最终答案：{final_answer}")
            print(f"任务完成，最终答案：{final_answer}")
            debug_log("Agent", f"========== Agent 执行完成 ==========\n")
            break
        
        # 解析工具调用
        debug_log("Agent", f"步骤 3.3.1: 解析工具调用")
        tool_name = re.search(r"(\w+)\(", action_str).group(1)
        args_str = re.search(r"\((.*)\)", action_str).group(1)
        kwargs = dict(re.findall(r'(\w+)="([^"]*)"', args_str))
        
        debug_log("Agent", f"解析结果:")
        debug_log("Agent", f"  - 工具名称：{tool_name}")
        debug_log("Agent", f"  - 参数字符串：{args_str}")
        debug_log("Agent", f"  - 参数字典：{kwargs}")
        
        # 执行工具函数
        debug_log("Agent", f"步骤 3.3.2: 执行工具函数")
        if tool_name in TOOLS:
            debug_log("Agent", f"✓ 工具 '{tool_name}' 已注册，正在调用...")
            observation = TOOLS[tool_name](**kwargs)
            debug_log("Agent", f"✓ 工具执行完成，返回结果长度：{len(observation) if observation else 0} 字符")
        else:
            debug_log("Agent", f"❌ 工具 '{tool_name}' 未注册")
            observation = f"错误：未定义的工具 '{tool_name}'"
        
        # 3.4. 记录观察结果
        debug_log("Agent", f"步骤 3.4: 记录观察结果")
        observation_str = f"Observation: {observation}"
        print(f"{observation_str}\n" + "=" * 40)
        prompt_history.append(observation_str)
        debug_log("Agent", f"已将观察结果添加到 prompt_history")
    
    else:
        # 达到最大循环次数仍未完成任务
        debug_log("Agent", f"⚠️ 已达到最大循环次数 {max_iterations}，任务可能未完成")
        print(f"已达到最大循环次数 {max_iterations}，任务可能未完成。")
    
    debug_log("Agent", "\n========== Agent 主循环结束 ==========\n")


if __name__ == "__main__":
    # 测试运行
    user_input = "你好，请帮我查询一下今天西安的天气，然后根据天气推荐一个合适的旅游景点。"
    run_agent(user_input)
