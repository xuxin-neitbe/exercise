# CAMEL 多 Agent 通信系统

## 项目简介

{{PROJECT_DESCRIPTION}}

本项目基于 CAMEL-AI 框架，实现了多智能体通信与协作系统。CAMEL 是首个 LLM 多智能体框架，专注于寻找智能体的规模规律，支持角色扮演、任务自动化、数据生成和世界模拟。

## 核心特性

- 🎭 **多智能体角色扮演** - 模拟不同角色的智能体进行协作
- 💬 **自主通信** - 智能体之间自主对话和协作
- 📊 **数据生成** - 自动生成大规模结构化数据
- ⚙️ **任务自动化** - 自动化完成复杂任务
- 🌍 **世界模拟** - 模拟环境和场景进行推演
- 📈 **可扩展性** - 支持多达百万智能体的系统
- 💾 **有状态记忆** - 智能体保持有状态的记忆

## 快速开始

### 1. 环境要求

- Python 3.10+
- OpenAI API Key

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 API 密钥

编辑 `.env` 文件：

```bash
OPENAI_API_KEY=your-api-key-here
```

### 4. 运行多智能体系统

```bash
# 运行基础角色扮演
python main.py

# 指定角色
python main.py --assistant-role "Coder" --user-role "Product Manager"

# 运行数据生成
python main.py --mode data-generation

# 运行任务自动化
python main.py --mode task-automation
```

## 项目结构

```
{{PROJECT_NAME}}/
├── agents/                  # Agent 定义
│   ├── __init__.py
│   ├── chat_agent.py       # 聊天 Agent
│   └── role_agent.py       # 角色扮演 Agent
├── scenarios/               # 场景定义
│   ├── __init__.py
│   ├── role_playing.py     # 角色扮演场景
│   ├── data_generation.py  # 数据生成场景
│   └── task_automation.py  # 任务自动化场景
├── tools/                   # 工具定义
│   ├── __init__.py
│   ├── code_interpreter.py # 代码解释器
│   └── web_search.py       # 网络搜索
├── config/                  # 配置文件
│   └── model_config.json   # 模型配置
├── main.py                  # 主入口
├── requirements.txt         # 依赖列表
├── .env.example            # 环境变量示例
└── README.md               # 项目文档
```

## 核心概念

### ChatAgent

CAMEL 的基础智能体类：

```python
from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType

# 创建模型
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI,
    model_type=ModelType.GPT_4,
    model_config_dict={"temperature": 0.7},
)

# 创建 ChatAgent
agent = ChatAgent(
    system_message="你是一个有帮助的助手。",
    model=model,
)
```

### 角色扮演 (Role Playing)

两个智能体扮演不同角色进行对话：

```python
from camel.agents import ChatAgent
from camel.messages import BaseMessage

# 创建助手智能体
assistant_sys_msg = BaseMessage.make_assistant_message(
    role_name="程序员",
    content="你是一个专业的程序员，负责编写代码。"
)

# 创建用户智能体
user_sys_msg = BaseMessage.make_user_message(
    role_name="产品经理",
    content="你是一个产品经理，负责提出需求。"
)

assistant_agent = ChatAgent(assistant_sys_msg)
user_agent = ChatAgent(user_sys_msg)

# 开始对话
user_msg = BaseMessage.make_user_message(
    role_name="产品经理",
    content="请实现一个计算器功能。"
)

response = assistant_agent.step(user_msg)
```

## 使用示例

### 基础角色扮演

```python
from camel.agents import ChatAgent
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.messages import BaseMessage
import os

# 创建模型
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI,
    model_type=ModelType.GPT_4,
    api_key=os.getenv("OPENAI_API_KEY"),
)

# 创建智能体
assistant_agent = ChatAgent(
    system_message="你是一个专业的 Python 程序员。",
    model=model,
)

user_agent = ChatAgent(
    system_message="你是一个产品经理。",
    model=model,
)

# 开始对话
user_msg = BaseMessage.make_user_message(
    role_name="产品经理",
    content="请实现一个快速排序算法。"
)

max_turns = 10
turn = 0

while turn < max_turns:
    # 用户发送消息
    user_response = user_agent.step(user_msg)
    print(f"产品经理:\n{user_response.msgs[0].content}\n")
    
    # 助手响应
    assistant_response = assistant_agent.step(user_response.msgs[0])
    print(f"程序员:\n{assistant_response.msgs[0].content}\n")
    
    # 检查是否结束
    if assistant_response.terminated:
        break
    
    user_msg = assistant_response.msgs[0]
    turn += 1
```

### 带工具的智能体

```python
from camel.agents import ChatAgent
from camel.toolkits import SearchToolkit

# 创建工具
search_tool = SearchToolkit().search_duckduckgo

# 创建带工具的 Agent
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI,
    model_type=ModelType.GPT_4,
)

agent = ChatAgent(
    system_message="你是一个有帮助的助手，可以使用工具。",
    model=model,
    tools=[search_tool],
)

# 使用工具
response = agent.step("搜索最新的 AI 新闻")
```

### 数据生成

```python
from camel.agents import ChatAgent
from camel.messages import BaseMessage

# 创建数据生成智能体
generator = ChatAgent(
    system_message="你是一个数据生成专家，负责生成高质量的训练数据。",
)

# 生成数据
for i in range(100):
    prompt = f"生成第 {i+1} 条训练数据"
    response = generator.step(BaseMessage.make_user_message(
        role_name="User",
        content=prompt
    ))
    
    # 保存数据
    with open(f"data/sample_{i}.txt", "w") as f:
        f.write(response.msgs[0].content)
```

## 配置选项

### 模型配置

在 `config/model_config.json` 中配置：

```json
{
  "model_platform": "OPENAI",
  "model_type": "gpt-4",
  "api_key": "{{API_KEY}}",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### 智能体配置

```python
agent = ChatAgent(
    system_message="你是一个助手。",
    model=model,
    memory=True,  # 启用记忆
    tools=[tool1, tool2],  # 工具列表
)
```

## 高级功能

### 代码解释器

```python
from camel.toolkits import CodeInterpreterToolkit

# 创建代码解释器工具
code_tool = CodeInterpreterToolkit()

# 在智能体中使用
agent = ChatAgent(
    system_message="你可以执行代码。",
    model=model,
    tools=[code_tool],
)
```

### 多智能体社会

```python
from camel.societies import RolePlaying

# 创建角色扮演社会
role_playing = RolePlaying(
    assistant_role_name="程序员",
    user_role_name="产品经理",
    assistant_agent_kwargs=dict(model=model),
    user_agent_kwargs=dict(model=model),
    task_prompt="开发一个待办事项应用",
)

# 运行社会模拟
chat_history = role_playing.run(n_turns=10)
```

### 世界模拟

```python
from camel.agents import ChatAgent

# 创建世界模拟智能体
world_simulator = ChatAgent(
    system_message="你是一个世界模拟器，负责模拟环境和场景。",
)

# 模拟场景
response = world_simulator.step(
    BaseMessage.make_user_message(
        role_name="User",
        content="模拟一个城市交通系统"
    )
)
```

## 常见问题

### Q: 如何切换模型？

A: 修改 `ModelFactory.create()` 中的 `model_type` 参数。

### Q: 如何保存对话历史？

A: 使用 `agent.memory.get_messages()` 获取记忆，然后保存到文件。

### Q: 如何添加自定义工具？

A: 继承 `BaseToolkit` 类，使用 `@Toolkit.register` 装饰器注册工具函数。

## 参考资源

- [CAMEL 官方文档](https://docs.camel-ai.org/)
- [CAMEL GitHub](https://github.com/camel-ai/camel)
- [CAMEL 示例集合](https://github.com/camel-ai/camel/tree/master/examples)
- [CAMEL Discord 社区](https://discord.gg/camel-ai)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
