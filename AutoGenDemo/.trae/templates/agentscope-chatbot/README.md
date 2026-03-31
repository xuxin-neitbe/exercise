# AgentScope 聊天机器人

## 项目简介

{{PROJECT_DESCRIPTION}}

本项目基于阿里 AgentScope 框架，实现了智能聊天机器人系统。通过 ReAct 智能体架构，支持工具调用、记忆管理和人机协作。

## 核心特性

- 🤖 **ReAct 智能体** - 结合推理与行动的先进架构
- 🛠️ **工具调用** - 支持代码执行、Shell 命令、网络搜索等工具
- 💾 **记忆管理** - 内置记忆模块，支持对话历史管理
- 👥 **人机协作** - 支持人类用户实时参与和反馈
- 📡 **流式响应** - 支持流式输出，提升用户体验
- 🔌 **多模型支持** - 支持 DashScope、OpenAI、Azure 等模型

## 快速开始

### 1. 环境要求

- Python 3.10+
- DashScope API Key（或 OpenAI API Key）

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 API 密钥

编辑 `.env` 文件：

```bash
DASHSCOPE_API_KEY=your-api-key-here
# 或使用 OpenAI
# OPENAI_API_KEY=your-api-key-here
```

### 4. 运行聊天机器人

```bash
# 运行基础聊天机器人
python main.py

# 启用工具调用
python main.py --with-tools

# 运行多智能体对话
python main.py --multi-agent
```

## 项目结构

```
{{PROJECT_NAME}}/
├── agents/                  # Agent 定义
│   ├── __init__.py
│   ├── react_agent.py      # ReAct 智能体
│   └── user_agent.py       # 用户接口
├── tools/                   # 工具定义
│   ├── __init__.py
│   ├── code_executor.py    # 代码执行工具
│   ├── web_search.py       # 网络搜索工具
│   └── shell_executor.py   # Shell 命令工具
├── config/                  # 配置文件
│   └── model_config.json   # 模型配置
├── utils/                   # 工具函数
│   └── memory_manager.py   # 记忆管理
├── main.py                  # 主入口
├── requirements.txt         # 依赖列表
├── .env.example            # 环境变量示例
└── README.md               # 项目文档
```

## Agent 角色

### ReAct Agent

**职责：** 主要的聊天机器人，支持推理和工具调用

**系统消息：**
```
你是一个有帮助的助手，能够使用工具完成任务。
你擅长：
- 理解用户需求
- 选择合适的工具
- 执行复杂任务
- 提供准确的回答
```

### User Agent

**职责：** 人类用户接口

**系统消息：**
```
人类用户
```

## 工具示例

### 代码执行工具

```python
from agentscope.tool import execute_python_code

# 执行 Python 代码
code = """
def add(a, b):
    return a + b

result = add(5, 3)
print(f"结果：{result}")
"""

result = execute_python_code(code)
```

### 网络搜索工具

```python
from agentscope.tool import SearchToolkit

search_tool = SearchToolkit()
result = search_tool.search_duckduckgo("AgentScope 框架")
```

## 使用示例

### 基础对话

```python
from agentscope.agent import ReActAgent, UserAgent
from agentscope.model import DashScopeChatModel
from agentscope.memory import InMemoryMemory
import asyncio

async def main():
    # 创建模型
    model = DashScopeChatModel(
        model_name="{{LLM_MODEL}}",
        api_key="{{API_KEY}}",
        stream=True,
    )
    
    # 创建 Agent
    agent = ReActAgent(
        name="assistant",
        sys_prompt="你是一个有帮助的助手。",
        model=model,
        memory=InMemoryMemory(),
    )
    
    user = UserAgent(name="user")
    
    # 开始对话
    msg = None
    while True:
        msg = await agent(msg)
        msg = await user(msg)
        if msg.get_text_content() == "exit":
            break

asyncio.run(main())
```

### 工具增强对话

```python
from agentscope.tool import Toolkit
from agentscope.tool import execute_python_code, execute_shell_command

# 创建工具包
toolkit = Toolkit()
toolkit.register_tool_function(execute_python_code)
toolkit.register_tool_function(execute_shell_command)

# 创建带工具的 Agent
agent = ReActAgent(
    name="assistant",
    sys_prompt="你是一个有帮助的助手，可以使用工具完成任务。",
    model=model,
    toolkit=toolkit,
)
```

## 配置选项

### 模型配置

在 `config/model_config.json` 中配置：

```json
{
  "model_name": "{{LLM_MODEL}}",
  "api_key": "{{API_KEY}}",
  "temperature": 0.7,
  "stream": true
}
```

### 记忆配置

```python
from agentscope.memory import InMemoryMemory

memory = InMemoryMemory(
    capacity={{MEMORY_CAPACITY}},  # 记忆容量
    max_words=1000  # 最大字数
)
```

## 高级功能

### 记忆压缩

当对话历史过长时，可以使用记忆压缩功能：

```python
from agentscope.memory import MemoryCompressor

compressed = MemoryCompressor.compress(
    messages=memory.get_memories(),
    model=model
)
```

### 多智能体协作

```python
from agentscope.agent import ReActAgent

# 创建多个专业 Agent
coder_agent = ReActAgent(name="coder", sys_prompt="你是专业的程序员")
reviewer_agent = ReActAgent(name="reviewer", sys_prompt="你是严格的代码审查员")

# 通过消息中心协调
from agentscope.msg_hub import MsgHub

async with MsgHub() as hub:
    hub.add(coder_agent, reviewer_agent)
    # 智能体自动协作
```

## 常见问题

### Q: 如何切换模型提供商？

A: 修改 `config/model_config.json` 中的模型配置，或更换 API Key。

### Q: 如何禁用代码执行？

A: 不注册 `execute_python_code` 工具函数即可。

### Q: 如何添加自定义工具？

A: 在 `tools/` 目录下创建工具函数，使用 `@Toolkit.register` 装饰器注册。

## 参考资源

- [AgentScope 官方文档](https://modelscope.github.io/agentscope/)
- [AgentScope GitHub](https://github.com/agentscope-ai/agentscope)
- [DashScope 文档](https://help.aliyun.com/zh/dashscope/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
