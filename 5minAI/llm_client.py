from openai import OpenAI

# 调试模式标志
DEBUG = True


def debug_log(module: str, message: str):
    """打印调试日志"""
    if DEBUG:
        print(f"[DEBUG][{module}] {message}")


class OpenAICompatibleClient:
    """
    一个用于调用任何兼容 OpenAI 接口的 LLM 服务的客户端。
    
    支持的服务商包括：
    - OpenAI 官方
    - Azure OpenAI
    - Ollama（本地模型）
    - 其他兼容 OpenAI API 格式的服务
    """
    
    def __init__(self, model: str, api_key: str, base_url: str):
        """
        初始化 LLM 客户端
        
        参数:
            model (str): 模型 ID，如 "gpt-4", "gpt-3.5-turbo"
            api_key (str): API 密钥
            base_url (str): API 服务端点 URL
        """
        debug_log("LLM_Client", f"========== 初始化 OpenAICompatibleClient ==========")
        debug_log("LLM_Client", f"模型：{model}")
        debug_log("LLM_Client", f"API Key: {api_key[:10]}...")  # 只显示前 10 个字符
        debug_log("LLM_Client", f"Base URL: {base_url}")
        
        self.model = model
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        
        debug_log("LLM_Client", "✓ 客户端初始化成功\n")
    
    def generate(self, prompt: str, system_prompt: str) -> str:
        """
        调用 LLM API 来生成回应
        
        参数:
            prompt (str): 用户输入的提示词
            system_prompt (str): 系统指令，定义 AI 的角色和行为
            
        返回:
            str: LLM 生成的文本内容
            
        异常处理:
            捕获所有 API 调用异常，返回友好的错误信息
        """
        debug_log("LLM_Client", f"========== 开始调用 LLM API ==========")
        print("正在调用大语言模型...")
        debug_log("LLM_Client", f"System Prompt 长度：{len(system_prompt)} 字符")
        debug_log("LLM_Client", f"User Prompt 长度：{len(prompt)} 字符")
        
        try:
            # 构建消息列表
            debug_log("LLM_Client", "正在构建消息列表...")
            messages = [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ]
            debug_log("LLM_Client", f"✓ 消息列表构建完成，共 {len(messages)} 条消息")
            
            # 调用 API
            debug_log("LLM_Client", f"正在调用 API (模型：{self.model})...")
            debug_log("LLM_Client", "请求参数：stream=False")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=False  # 不使用流式输出
            )
            
            debug_log("LLM_Client", f"✓ API 响应成功")
            debug_log("LLM_Client", f"响应类型：{type(response)}")
            debug_log("LLM_Client", f"choices 数量：{len(response.choices)}")
            
            # 提取生成的内容
            debug_log("LLM_Client", "正在提取生成的内容...")
            answer = response.choices[0].message.content
            debug_log("LLM_Client", f"✓ 提取成功，答案长度：{len(answer) if answer else 0} 字符")
            
            print("大语言模型响应成功。")
            debug_log("LLM_Client", f"========== LLM API 调用完成 ==========\n")
            
            return answer
            
        except Exception as e:
            debug_log("LLM_Client", f"❌ 调用异常：{type(e).__name__}: {e}")
            debug_log("LLM_Client", f"========== LLM API 调用失败 ==========\n")
            print(f"调用 LLM API 时发生错误：{e}")
            return "错误：调用语言模型服务时出错。"
