# LangGraph 工作流系统

## 项目简介

{{PROJECT_DESCRIPTION}}

本项目基于 LangChain LangGraph 框架，实现了状态化、持久化的智能体工作流系统。支持复杂任务编排、人机协同和故障恢复。

## 核心特性

- ⚙️ **持久化执行** - 构建能够持久化运行、自动从故障恢复的智能体
- 👥 **人机协同** - 在任意检查点检查和修改智能体状态，实现人类监督
- 💾 **综合记忆** - 短期工作记忆用于持续推理，长期持久记忆跨会话保存
- 🔍 **可视化调试** - 通过 LangSmith 深度可视化复杂智能体行为
- 📊 **状态图编排** - 使用图结构灵活定义工作流和状态转换
- 🌊 **流式处理** - 支持实时输出和增量更新

## 快速开始

### 1. 环境要求

- Python 3.10+
- OpenAI API Key（或 Anthropic API Key）

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置 API 密钥

编辑 `.env` 文件：

```bash
OPENAI_API_KEY=your-api-key-here
# 或使用 Anthropic
# ANTHROPIC_API_KEY=your-api-key-here
```

### 4. 运行工作流

```bash
# 运行基础工作流
python main.py

# 运行人机协同工作流
python main.py --human-in-loop

# 运行自定义工作流
python main.py --workflow custom
```

## 项目结构

```
{{PROJECT_NAME}}/
├── workflows/               # 工作流定义
│   ├── __init__.py
│   ├── planner_executor.py # 规划 - 执行工作流
│   ├── conditional.py      # 条件分支工作流
│   └── human_in_loop.py    # 人机协同工作流
├── nodes/                   # 节点定义
│   ├── __init__.py
│   ├── planner_node.py     # 规划节点
│   ├── executor_node.py    # 执行节点
│   └── reviewer_node.py    # 审查节点
├── state/                   # 状态定义
│   ├── __init__.py
│   └── workflow_state.py   # 工作流状态
├── checkpoints/             # 检查点存储
├── config/                  # 配置文件
│   └── llm_config.json     # LLM 配置
├── main.py                  # 主入口
├── requirements.txt         # 依赖列表
├── .env.example            # 环境变量示例
└── README.md               # 项目文档
```

## 核心概念

### 状态图 (StateGraph)

LangGraph 的核心抽象，用于定义工作流：

```python
from langgraph.graph import StateGraph, START

class State(TypedDict):
    messages: list
    plan: str
    result: str

# 创建图
graph = StateGraph(State)

# 添加节点
graph.add_node("planner", planner_node)
graph.add_node("executor", executor_node)
graph.add_node("reviewer", reviewer_node)

# 添加边
graph.add_edge(START, "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", "reviewer")

# 编译
app = graph.compile()
```

### 检查点 (Checkpoints)

持久化状态，支持故障恢复：

```python
from langgraph.checkpoint import MemorySaver

# 创建检查点保存器
saver = MemorySaver()

# 编译时传入
app = graph.compile(checkpointer=saver)

# 使用线程 ID 恢复状态
config = {"configurable": {"thread_id": "123"}}
result = app.invoke(input, config=config)
```

### 人机协同 (Human-in-the-Loop)

在关键节点暂停等待人类审批：

```python
# 在节点前设置中断
graph.set_interrupt_before(["executor"])

# 恢复执行
app = graph.compile(checkpointer=saver, interrupt_before=["executor"])

# 人类审查后继续
app.invoke(None, config=config)
```

## 工作流示例

### 规划 - 执行 - 审查工作流

```python
from langgraph.graph import StateGraph, START
from typing import TypedDict, List

class State(TypedDict):
    task: str
    plan: str
    steps: List[str]
    current_step: int
    result: str

def planner_node(state: State):
    """规划节点：分析任务并制定计划"""
    task = state["task"]
    # 使用 LLM 制定计划
    plan = f"详细计划：{task}"
    steps = ["步骤 1", "步骤 2", "步骤 3"]
    
    return {
        "plan": plan,
        "steps": steps,
        "current_step": 0
    }

def executor_node(state: State):
    """执行节点：执行当前步骤"""
    current_step = state["current_step"]
    steps = state["steps"]
    
    if current_step >= len(steps):
        return {"result": "任务完成"}
    
    # 执行当前步骤
    step = steps[current_step]
    result = f"执行：{step}"
    
    return {
        "current_step": current_step + 1,
        "result": result
    }

def reviewer_node(state: State):
    """审查节点：检查结果"""
    result = state["result"]
    
    # 检查是否完成
    if "完成" in result:
        return None  # 结束
    
    # 需要继续执行
    return {"current_step": state["current_step"]}

# 构建图
graph = StateGraph(State)
graph.add_node("planner", planner_node)
graph.add_node("executor", executor_node)
graph.add_node("reviewer", reviewer_node)

graph.add_edge(START, "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", "reviewer")
graph.add_conditional_edges(
    "reviewer",
    lambda x: "executor" if x["current_step"] < len(x["steps"]) else "__end__"
)

app = graph.compile()
```

### 人机协同工作流

```python
from langgraph.checkpoint import MemorySaver

# 创建检查点保存器
saver = MemorySaver()

# 编译时设置中断点
app = graph.compile(
    checkpointer=saver,
    interrupt_before=["executor"]  # 在执行前暂停
)

# 运行到中断点
config = {"configurable": {"thread_id": "task-123"}}
result = app.invoke({"task": "复杂任务"}, config=config)

# 人类审查和修改状态
print(f"计划：{result['plan']}")
print("等待人类审批...")

# 人类批准后继续
app.invoke(None, config=config)
```

## 配置选项

### LLM 配置

在 `config/llm_config.json` 中配置：

```json
{
  "provider": "openai",
  "model": "{{LLM_MODEL}}",
  "api_key": "{{API_KEY}}",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### 检查点配置

```python
from langgraph.checkpoint import SqliteSaver

# 使用 SQLite 持久化
saver = SqliteSaver.from_conn_string("checkpoints.db")

app = graph.compile(checkpointer=saver)
```

## 高级功能

### 子图 (Subgraphs)

将复杂工作流分解为子图：

```python
# 创建子图
subgraph = StateGraph(SubState)
subgraph.add_node("step1", step1_node)
subgraph.add_node("step2", step2_node)
subgraph.add_edge("step1", "step2")

# 在主图中添加子图
main_graph = StateGraph(MainState)
main_graph.add_node("subgraph", subgraph.compile())
```

### 分支 (Branching)

条件分支执行：

```python
def should_continue(state):
    if state["status"] == "success":
        return "success_node"
    else:
        return "retry_node"

graph.add_conditional_edges(
    "decision_node",
    should_continue,
    {
        "success_node": "success_node",
        "retry_node": "retry_node"
    }
)
```

### 记忆管理

```python
from langchain.memory import ConversationBufferMemory

# 添加长期记忆
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 在节点中使用
def chat_node(state):
    history = memory.load_memory_variables({})
    # 使用历史对话
```

## 常见问题

### Q: 如何保存和恢复状态？

A: 使用 `checkpointer` 参数编译图，并通过 `thread_id` 恢复状态。

### Q: 如何在运行时修改状态？

A: 在人机协同中断点，使用 `app.update_state(config, new_state)` 修改状态。

### Q: 如何调试工作流？

A: 使用 LangSmith 平台可视化执行路径和状态转换。

## 参考资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [LangChain 文档](https://python.langchain.com/)
- [LangSmith 调试平台](https://smith.langchain.com/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
