# 智能旅行助手 Agent - 项目说明

## 项目概述

这是一个基于大语言模型的智能体（Agent）系统，能够：
1. 查询城市天气
2. 根据天气推荐旅游景点
3. 自主决策使用哪个工具

## 核心设计理念

### 1. **工具 + 提示工程**
- **工具**：提供实际执行能力（API 调用）
- **提示工程**：通过精心设计的 System Prompt 引导 LLM 正确决策

### 2. **ReAct 模式**
智能体遵循 **Reasoning + Acting** 循环：
```
思考 (Thought) → 行动 (Action) → 观察 (Observation) → 思考...
```

## 项目文件结构

```
5minAI/
├── tools.py              # 工具函数集合
├── llm_client.py         # LLM 客户端封装
├── agent.py              # Agent 主循环
├── config_guide.md       # API 配置指南
└── README.md             # 本文件（项目说明）
```

---

## 文件详细说明

### 1. [`tools.py`](file:///d:/Projects/5minAI/tools.py) - 工具函数

**作用**：提供 Agent 可调用的所有工具

**包含的工具**：

#### `get_weather(city: str) -> str`
- **功能**：查询城市实时天气
- **API**：wttr.in（免费，无需密钥）
- **返回**：格式化天气信息，如"北京当前天气：晴，气温 25 摄氏度"
- **要点**：
  - 使用 `requests` 库发起 HTTP 请求
  - 解析 JSON 格式的天气数据
  - 完整的错误处理（网络错误、数据解析错误）

#### `get_attraction(city: str, weather: str) -> str`
- **功能**：根据城市和天气推荐景点
- **API**：Tavily Search API
- **返回**：AI 生成的景点推荐总结
- **要点**：
  - 从环境变量读取 API 密钥
  - 构造精确的搜索查询
  - 使用 `include_answer=True` 获得 AI 总结答案
  - 降级处理：如果没有总结答案，格式化原始搜索结果

#### `TOOLS` 字典
```python
TOOLS = {
    "get_weather": get_weather,
    "get_attraction": get_attraction,
}
```
- **作用**：注册所有可用工具
- **用途**：主循环通过函数名动态调用工具

---

### 2. [`llm_client.py`](file:///d:/Projects/5minAI/llm_client.py) - LLM 客户端

**作用**：封装对大语言模型的调用

**核心类**：`OpenAICompatibleClient`

**设计要点**：
- **兼容性**：支持任何遵循 OpenAI API 格式的服务
  - OpenAI 官方
  - Azure OpenAI
  - Ollama（本地模型）
  - 其他兼容服务

- **三个必需参数**：
  - `model`：模型 ID
  - `api_key`：API 密钥
  - `base_url`：API 端点

- **generate 方法**：
  - 构建标准的消息格式（system + user）
  - 调用 API 生成响应
  - 错误处理

---

### 3. [`agent.py`](file:///d:/Projects/5minAI/agent.py) - Agent 主程序

**作用**：整合所有组件，运行 Agent 核心循环

**核心组件**：

#### `AGENT_SYSTEM_PROMPT`
- **作用**：定义 Agent 的行为规范
- **关键约束**：
  - 必须输出 Thought-Action 对
  - Action 格式：工具调用或 Finish
  - 每次只输出一对

#### `run_agent()` 函数
**主循环流程**：

1. **初始化**
   - 配置 LLM 客户端
   - 设置环境变量
   - 初始化对话历史

2. **循环执行**（最多 5 次）：
   ```
   a. 构建 Prompt（累积历史）
   b. 调用 LLM 生成 Thought-Action
   c. 截断多余的输出（只保留第一对）
   d. 解析 Action：
      - 如果是 Finish → 输出答案，结束
      - 如果是工具调用 → 执行工具，记录 Observation
   e. 将结果加入历史，继续循环
   ```

3. **正则表达式解析**：
   - 提取 Thought-Action 对
   - 解析工具名称和参数
   - 检查是否是 Finish

---

## 执行流程示例

**用户输入**：
> "你好，请帮我查询一下今天北京的天气，然后根据天气推荐一个合适的旅游景点。"

**循环 1**：
```
Thought: 用户想去北京旅行，我需要先查询北京的天气
Action: get_weather(city="北京")

Observation: 北京当前天气：晴，气温 25 摄氏度
```

**循环 2**：
```
Thought: 现在我知道北京天气晴朗，可以推荐适合的景点
Action: get_attraction(city="北京", weather="晴")

Observation: [AI 生成的景点推荐总结...]
```

**循环 3**：
```
Thought: 我已经收集到天气和景点信息，可以给用户完整答案了
Action: Finish[北京今天天气晴朗，推荐您游览故宫、天坛...]
```

---

## 关键技术点

### 1. **Prompt 工程**
- System Prompt 定义角色和行为规范
- 明确的输出格式要求
- 约束每次只输出一对 Thought-Action

### 2. **正则表达式解析**
```python
# 截断多余的 Thought-Action
match = re.search(r'(Thought:.*?Action:.*?)(?=\n\s*(?:Thought:|Action:|Observation:)|\Z)', llm_output, re.DOTALL)

# 解析 Action
action_match = re.search(r"Action: (.*)", llm_output, re.DOTALL)

# 解析工具调用
tool_name = re.search(r"(\w+)\(", action_str).group(1)
args_str = re.search(r"\((.*)\)", action_str).group(1)
kwargs = dict(re.findall(r'(\w+)="([^"]*)"', args_str))
```

### 3. **工具注册与动态调用**
- 使用字典注册工具
- 通过函数名动态查找并调用
- 支持任意数量的工具扩展

### 4. **错误处理**
- 网络请求异常
- API 调用异常
- 数据解析异常
- 工具未定义检查

---

## 扩展指南

### 添加新工具

1. 在 [`tools.py`](file:///d:/Projects/5minAI/tools.py) 中定义新函数：
```python
def new_tool(param1: str, param2: str) -> str:
    """工具描述"""
    # 实现逻辑
    return "结果"
```

2. 注册到 `TOOLS` 字典：
```python
TOOLS = {
    "get_weather": get_weather,
    "get_attraction": get_attraction,
    "new_tool": new_tool,  # 新增
}
```

3. 更新 `AGENT_SYSTEM_PROMPT`：
```python
AGENT_SYSTEM_PROMPT = """
# 可用工具:
- `get_weather(city: str)`: ...
- `get_attraction(city: str, weather: str)`: ...
- `new_tool(param1: str, param2: str)`: 新功能说明
"""
```

---

## 运行项目

### 1. 安装依赖
```bash
pip install requests tavily-python openai
```

### 2. 配置 API 密钥
参考 [`config_guide.md`](file:///d:/Projects/5minAI/config_guide.md)

### 3. 运行
```bash
python agent.py
```

---

## 总结

这个项目展示了构建 AI Agent 的核心要素：

1. **工具层**：提供实际执行能力
2. **模型层**：提供决策和推理能力
3. **协调层**：通过 Prompt 工程和循环逻辑整合工具与模型

这正是当前主流 Agent 框架（如 LangChain、LlamaIndex）的设计精髓！
