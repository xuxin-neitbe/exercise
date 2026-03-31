# AutoGen 多 Agent 协作系统

## 项目简介

{{PROJECT_DESCRIPTION}}

本项目基于微软 AutoGen 框架，实现了多智能体协作系统。通过定义不同角色的 Agent（如 Coder、Reviewer 等），实现自动化的代码编写、审查和执行。

## 核心特性

- 🤖 **多 Agent 协作** - 支持多个角色 Agent 协同工作
- 💻 **代码自动生成** - Coder Agent 可自动生成高质量代码
- 🔍 **代码审查** - Reviewer Agent 自动审查代码质量
- 🔄 **灵活工作流** - 支持代码审查、结对编程等多种工作流
- 👥 **人类反馈** - 支持人类用户参与决策和反馈
- 🔌 **多 LLM 支持** - 支持 OpenAI、Azure、本地模型

## 快速开始

### 1. 环境要求

- Python 3.10+
- OpenAI API Key（或 Azure/OpenAI 兼容 API）

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 LLM

编辑 `config/oai_config.json` 文件，配置你的 LLM 提供商和 API 密钥：

```json
{
  "config_list": [
    {
      "model": "{{LLM_MODEL}}",
      "api_key": "your-api-key-here"
    }
  ]
}
```

或者使用环境变量：

```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 4. 运行示例

```bash
# 运行代码审查工作流
python main.py --workflow code_review

# 运行结对编程工作流
python main.py --workflow pair_programming

# 自定义 Agent 数量
python main.py --agents 3
```

## 项目结构

```
{{PROJECT_NAME}}/
├── agents/                  # Agent 定义
│   ├── __init__.py
│   ├── coder_agent.py      # 代码编写 Agent
│   ├── reviewer_agent.py   # 代码审查 Agent
│   └── human_agent.py      # 人类反馈接口
├── workflows/               # 工作流定义
│   ├── __init__.py
│   ├── code_review.py      # 代码审查工作流
│   └── pair_programming.py # 结对编程工作流
├── config/                  # 配置文件
│   └── oai_config.json     # LLM 配置
├── utils/                   # 工具函数
│   └── llm_helper.py       # LLM 辅助函数
├── main.py                  # 主入口
├── requirements.txt         # 依赖列表
├── .env.example            # 环境变量示例
└── README.md               # 项目文档
```

## Agent 角色

### Coder Agent

**职责：** 根据需求编写代码

**系统消息：**
```
你是一个专业的 Python 开发者。你负责编写高质量、可维护的代码。
你擅长：
- 理解需求并转化为代码
- 编写清晰、有注释的代码
- 遵循最佳实践
```

### Reviewer Agent

**职责：** 审查代码质量和安全性

**系统消息：**
```
你是一个严格的代码审查专家。你负责发现代码中的问题并提出改进建议。
你关注：
- 代码质量和可读性
- 潜在的安全问题
- 性能优化建议
- 测试覆盖率
```

### Human Agent

**职责：** 人类用户接口，提供反馈和决策

**系统消息：**
```
人类用户的代表，负责提供关键决策和反馈。
在需要人类判断时介入。
```

## 工作流示例

### 代码审查流程

```
1. 用户提出需求
   ↓
2. Coder Agent 编写代码
   ↓
3. Reviewer Agent 审查代码
   ↓
4. 如果有问题 → 返回步骤 2 修改
   ↓
5. 审查通过 → 输出最终代码
```

### 结对编程流程

```
1. 用户提出需求
   ↓
2. Coder Agent 编写代码
   ↓
3. Reviewer Agent 实时提供建议
   ↓
4. Coder Agent 根据建议调整
   ↓
5. 协作完成功能
```

## 配置选项

### LLM 配置

在 `config/oai_config.json` 中配置：

```json
{
  "config_list": [
    {
      "model": "{{LLM_MODEL}}",
      "api_key": "{{API_KEY}}"
    }
  ],
  "timeout": {{TIMEOUT_SECONDS}},
  "temperature": 0.7
}
```

### Agent 配置

在代码中配置 Agent 参数：

```python
from agents.coder_agent import CoderAgent
from agents.reviewer_agent import ReviewerAgent

config = {
    "enable_code_execution": {{ENABLE_CODE_EXECUTION}},
    "enable_human_feedback": {{ENABLE_HUMAN_FEEDBACK}},
    "timeout": {{TIMEOUT_SECONDS}}
}

coder = CoderAgent(config)
reviewer = ReviewerAgent(config)
```

## 自定义 Agent

你可以创建自己的 Agent 角色：

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

class CustomAgent:
    def __init__(self, name, system_message, config):
        # 创建模型客户端
        self.model_client = OpenAIChatCompletionClient(
            model=config.get('model', 'gpt-4'),
            api_key=config.get('api_key', '')
        )
        
        # 创建 Agent
        self.agent = AssistantAgent(
            name=name,
            model_client=self.model_client,
            system_message=system_message
        )
    
    async def chat(self, message):
        """发送消息并获取回复（异步）"""
        result = await self.agent.run(task=message)
        return result.messages[-1].content if hasattr(result, 'messages') else str(result)
    
    def chat_sync(self, message):
        """同步包装器"""
        import asyncio
        return asyncio.run(self.chat(message))
    
    def close(self):
        """清理资源"""
        if hasattr(self.model_client, 'close'):
            self.model_client.close()
```

## 常见问题

### Q: 如何更换 LLM 提供商？

A: 编辑 `config/oai_config.json`，修改 `model` 和 `api_key` 字段。

### Q: 如何禁用代码执行？

A: 设置 `{{ENABLE_CODE_EXECUTION}}` 为 `false`。

### Q: 如何添加新的 Agent 角色？

A: 在 `agents/` 目录下创建新的 Agent 类，继承 `AssistantAgent` 并使用新的 AgentChat API。

## 参考资源

- [AutoGen 官方文档](https://microsoft.github.io/autogen/)
- [AutoGen GitHub 仓库](https://github.com/microsoft/autogen)
- [AutoGen 示例集合](https://microsoft.github.io/autogen/docs/Examples/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
