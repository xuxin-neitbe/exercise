"""
Calculator Agent - 使用 LLM Function Calling 调用 Calculator Skill

这个 Agent 通过 DashScope API 调用大模型，使用 function calling 功能
来调用 calculator skill 完成算术运算。

特点：
- 支持动态注册 Skills，无需修改代码
- Skills 通过配置文件或插件系统加载
- 符合标准 Agent 框架的 Skills 管理机制
"""

import os
import sys
import json
import logging
import importlib
from pathlib import Path
from openai import OpenAI
from typing import Dict, Any, Callable

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 加载环境变量（使用绝对路径）
try:
    from dotenv import load_dotenv
    from pathlib import Path
    
    # 获取当前文件所在目录的 .env 文件
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        logger.debug(f"已加载环境变量：{env_path}")
    else:
        logger.warning(f".env 文件不存在：{env_path}")
except ImportError:
    logger.warning("未安装 python-dotenv，使用系统环境变量")


def message_to_dict(message) -> dict:
    """将 ChatCompletionMessage 转换为字典"""
    result = {"role": message.role}
    if message.content:
        result["content"] = message.content
    if message.tool_calls:
        result["tool_calls"] = []
        for tc in message.tool_calls:
            result["tool_calls"].append({
                "id": tc.id,
                "type": tc.type,
                "function": {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments
                }
            })
    return result


class SkillRegistry:
    """Skills 注册表 - 管理所有可用的 Skills"""
    
    def __init__(self):
        self._skills: Dict[str, Dict[str, Any]] = {}
    
    def register(self, name: str, func: Callable, schema: Dict[str, Any]):
        """
        注册一个 Skill
        
        Args:
            name: Skill 名称
            func: Skill 函数
            schema: Function Calling 的 JSON Schema
        """
        self._skills[name] = {
            "function": func,
            "schema": schema
        }
        logger.debug(f"注册 Skill: {name}")
    
    def get(self, name: str) -> Dict[str, Any]:
        """获取已注册的 Skill"""
        if name not in self._skills:
            raise ValueError(f"Skill '{name}' not found. Available: {list(self._skills.keys())}")
        return self._skills[name]
    
    def execute(self, name: str, **kwargs) -> Any:
        """执行 Skill"""
        skill = self.get(name)
        logger.debug(f"执行 Skill: {name}, 参数：{kwargs}")
        return skill["function"](**kwargs)
    
    def get_all_schemas(self) -> list:
        """获取所有 Skills 的 Schema（用于 LLM tools 参数）"""
        return [skill["schema"] for skill in self._skills.values()]
    
    def load_from_module(self, module_name: str):
        """
        从 Python 模块动态加载 Skills
        
        模块需要导出：
        - get_skill_info 函数（推荐）
        或者：
        - execute 函数和 get_tool_schema 函数（向后兼容）
        """
        try:
            module = importlib.import_module(module_name)
            
            # 方式 1：使用通用接口 get_skill_info（推荐）
            if hasattr(module, 'get_skill_info'):
                skill_info = module.get_skill_info()
                self.register(
                    name=skill_info["name"],
                    func=skill_info["function"],
                    schema=skill_info["schema"]
                )
                logger.info(f"从模块加载 Skill: {module_name} (名称：{skill_info['name']})")
            
            # 方式 2：向后兼容，支持旧的 execute + get_tool_schema 接口
            elif hasattr(module, 'execute') and hasattr(module, 'get_tool_schema'):
                schema = module.get_tool_schema()
                self.register(
                    name=schema["function"]["name"],  # 从 schema 获取 skill 名称
                    func=module.execute,  # 使用通用函数名
                    schema=schema
                )
                logger.info(f"从模块加载 Skill: {module_name} (名称：{schema['function']['name']})")
            
            # 方式 3：向后兼容，支持旧的 calculate + get_tool_schema 接口（仅用于计算器）
            elif hasattr(module, 'calculate') and hasattr(module, 'get_tool_schema'):
                self.register(
                    name="calculate",
                    func=module.calculate,
                    schema=module.get_tool_schema()
                )
                logger.info(f"从模块加载 Skill: {module_name} (旧接口)")
            else:
                logger.warning(f"模块 {module_name} 缺少必要的函数")
        except ImportError as e:
            logger.error(f"导入模块失败 {module_name}: {e}")
    
    def load_from_directory(self, skills_dir: str):
        """
        从目录动态加载所有 Skills
        
        自动发现并加载所有符合规范的 Skill 模块
        """
        skills_path = Path(skills_dir)
        if not skills_path.exists():
            logger.warning(f"Skills 目录不存在：{skills_dir}")
            return
        
        for skill_file in skills_path.glob("*/scripts/*.py"):
            if skill_file.name.startswith("_"):
                continue
            
            module_name = str(skill_file.relative_to(Path.cwd())).replace("/", ".").replace("\\", ".").replace(".py", "")
            self.load_from_module(module_name)


class CalculatorAgent:
    """计算器 Agent，通过 LLM Function Calling 调用计算器技能"""
    
    # System prompt - 引导 LLM 正确使用工具
    SYSTEM_PROMPT = """你是一个精确的计算器助手。你的任务是通过调用 calculate 工具来完成算术运算。

重要规则：
1. 对于任何算术表达式，你必须逐步调用 calculate 工具，直到得到最终结果
2. 不要直接用文字回答计算结果，必须使用工具
3. 对于混合运算（如 4+6*7/5），你需要：
   - 先计算乘除：6*7=42
   - 再计算除法：42/5=8.4
   - 最后计算加法：4+8.4=12.4
4. 持续调用工具，直到表达式完全计算完毕
5. 只有当你得到最终数值结果后，才用文字回复用户

记住：你的核心任务是调用工具，不是直接计算！"""
    
    def __init__(
        self,
        model_id: str = "tongyi-xiaomi-analysis-pro",
        api_key: str = None,
        base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1",
        timeout: int = 60,
        auto_load_skills: bool = True
    ):
        logger.debug(f"初始化 CalculatorAgent: model_id={model_id}, base_url={base_url}, timeout={timeout}")
        
        self.model_id = model_id
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY", "")
        self.base_url = base_url
        self.timeout = timeout
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=self.timeout
        )
        logger.debug("OpenAI 客户端初始化完成")
        
        # 初始化 Skills 注册表
        self.skills = SkillRegistry()
        
        # 自动加载 Skills
        if auto_load_skills:
            self._auto_load_skills()
        
        self.conversation_history = []
        self.tools = self._get_tools()  # 初始化 tools 属性
        logger.debug(f"已加载 Skills: {list(self.skills._skills.keys())}")
    
    def _auto_load_skills(self):
        """自动加载 Skills"""
        # 方式 1：从模块加载（推荐 - 配置化）
        self.skills.load_from_module("skills.calculator.scripts.calculator_impl")
        
        # 方式 2：从目录加载（插件式）
        # skills_dir = Path(__file__).parent / "skills"
        # self.skills.load_from_directory(str(skills_dir))
        
        # 方式 3：从配置文件加载（最灵活）
        # self._load_skills_from_config()
    
    def _load_skills_from_config(self):
        """从配置文件加载 Skills（支持热更新）"""
        config_file = Path(__file__).parent / "skills_config.json"
        if not config_file.exists():
            return
        
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        for skill_config in config.get("skills", []):
            module_name = skill_config.get("module")
            if module_name:
                self.skills.load_from_module(module_name)
    
    def _get_tools(self) -> list:
        """获取 function calling 工具定义（从 Skills 注册表动态生成）"""
        return self.skills.get_all_schemas()
    
    def execute_skill(self, name: str, **kwargs) -> Dict[str, Any]:
        """
        执行 Skill（统一入口）
        
        Args:
            name: Skill 名称
            **kwargs: Skill 参数
        
        Returns:
            Skill 执行结果
        """
        return self.skills.execute(name, **kwargs)
    
    def _get_history_for_log(self) -> list:
        """获取可序列化的对话历史"""
        result = []
        for msg in self.conversation_history:
            if isinstance(msg, dict):
                result.append(msg)
            else:
                result.append(message_to_dict(msg))
        return result
    
    def process_query(self, user_input: str) -> str:
        """处理用户查询 - 通过 LLM Function Calling，支持多步工具调用"""
        logger.info(f"[USER INPUT] {user_input}")
        
        # 如果是第一次调用，添加 system prompt
        if len(self.conversation_history) == 0:
            self.conversation_history.append({
                "role": "system",
                "content": self.SYSTEM_PROMPT
            })
        
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        logger.debug(f"对话历史长度：{len(self.conversation_history)}")
        
        try:
            # 循环调用，直到 LLM 不再调用工具
            max_iterations = 10  # 防止无限循环
            iteration = 0
            
            while iteration < max_iterations:
                iteration += 1
                logger.debug(f"[API CALL {iteration}] 调用模型：{self.model_id}")
                logger.debug(f"[API CALL {iteration}] 消息：{json.dumps(self._get_history_for_log(), ensure_ascii=False, indent=2)}")
                logger.debug(f"[API CALL {iteration}] tools: {json.dumps(self._get_tools(), ensure_ascii=False, indent=2)}")
                
                response = self.client.chat.completions.create(
                    model=self.model_id,
                    messages=self.conversation_history,
                    tools=self.tools,
                    tool_choice="auto"
                )
                
                message = response.choices[0].message
                logger.debug(f"[API RESPONSE {iteration}] role={message.role}, content={message.content}")
                logger.debug(f"[API RESPONSE {iteration}] tool_calls={message.tool_calls}")
                
                # 如果没有工具调用，返回最终结果
                if not message.tool_calls:
                    logger.debug(f"[NO TOOL CALLS {iteration}] 直接返回模型回复")
                    self.conversation_history.append(message)
                    logger.info(f"[FINAL ANSWER] {message.content}")
                    return message.content or "计算完成"
                
                # 有工具调用，执行所有工具
                logger.info(f"[TOOL CALLS DETECTED {iteration}] 数量：{len(message.tool_calls)}")
                self.conversation_history.append(message)
                
                for i, tool_call in enumerate(message.tool_calls):
                    logger.debug(f"[TOOL CALL {i+1}] id={tool_call.id}, name={tool_call.function.name}")
                    logger.debug(f"[TOOL CALL {i+1}] arguments={tool_call.function.arguments}")
                    
                    # 动态获取 skill 名称，不硬编码
                    skill_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    logger.debug(f"[PARSED ARGS] {json.dumps(args, ensure_ascii=False)}")
                    
                    # ✅ 通过 Skills 注册表执行，动态调用
                    result = self.skills.execute(skill_name, **args)
                    
                    tool_response = {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, ensure_ascii=False)
                    }
                    self.conversation_history.append(tool_response)
                    logger.debug(f"[TOOL RESPONSE] {json.dumps(tool_response, ensure_ascii=False)}")
                
                # 继续循环，让 LLM 决定是否需要进一步计算
            
            # 超过最大迭代次数
            logger.warning(f"超过最大迭代次数 {max_iterations}，强制返回")
            return f"计算过于复杂，超过最大迭代次数 {max_iterations}"
            
        except Exception as e:
            logger.error(f"[API ERROR] {type(e).__name__}: {str(e)}")
            return f"API 调用错误：{str(e)}"
    
    def clear_history(self):
        """清空对话历史"""
        logger.debug("清空对话历史")
        self.conversation_history = []
    
    def register_skill(self, name: str, func: Callable, schema: Dict[str, Any]):
        """
        外部注册 Skill 的接口
        
        使用方式：
        agent = CalculatorAgent(auto_load_skills=False)
        from skills.calculator.scripts.calculator_impl import calculate, get_tool_schema
        agent.register_skill("calculate", calculate, get_tool_schema())
        """
        self.skills.register(name, func, schema)


def main():
    """主函数 - 命令行交互"""
    print("=" * 50)
    print("Calculator Agent - 基于 LLM Function Calling")
    print("支持动态 Skills 注册")
    print("=" * 50)
    print("\n支持的运算：加法(+), 减法(-), 乘法(*), 除法(/)")
    print("示例：'计算 5 加 3', '10 除以 2', '5/2 等于多少'")
    print("输入 'quit' 或 'exit' 退出\n")
    
    agent = CalculatorAgent(
        model_id=os.getenv("DASHSCOPE_MODEL", "tongyi-xiaomi-analysis-pro"),
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url=os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        timeout=60,
        auto_load_skills=True  # 自动加载 Skills
    )
    
    while True:
        try:
            user_input = input("请输入计算问题：").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ["quit", "exit", "q"]:
                print("再见!")
                break
            
            if user_input.lower() == "clear":
                agent.clear_history()
                print("对话历史已清空\n")
                continue
            
            result = agent.process_query(user_input)
            print(f"结果：{result}\n")
            
        except KeyboardInterrupt:
            print("\n\n再见!")
            break
        except Exception as e:
            logger.error(f"发生错误：{e}")
            print(f"发生错误：{e}\n")


if __name__ == "__main__":
    main()
