# ReActAgent 核心特点解析

## 📖 什么是 ReActAgent？

**ReActAgent** 是 AgentScope 框架中的核心智能体类，基于 **ReAct（Reasoning + Acting）** 架构实现。它结合了推理能力和行动能力，使 AI 能够像人类一样思考并执行任务。

---

## 🎯 核心特点

### 1. **ReAct 架构（推理 + 行动）**

ReActAgent 的核心思想是将**推理（Reasoning）**和**行动（Acting）**结合起来：

```python
# ReAct 循环
while not task_completed:
    # 1. 推理（Reasoning）
    思考：当前情况是什么？我需要做什么？
    
    # 2. 行动（Acting）
    行动：调用工具执行具体任务
    
    # 3. 观察（Observation）
    观察：工具返回了什么结果？
    
    # 4. 重复直到任务完成
```

**优势：**
- ✅ 更像人类思维方式
- ✅ 能够处理复杂任务
- ✅ 支持多步推理
- ✅ 可解释性强

---

### 2. **工具调用能力（Tool Calling）**

ReActAgent 可以调用各种工具来完成任务：

```python
# 创建智能体时添加工具包
agent = ReActAgent(
    name="assistant",
    sys_prompt="你是有帮助的助手",
    model=model,
    toolkit=toolkit,  # 工具包
)

# 注册工具函数
toolkit.register_tool_function(execute_python_code)
toolkit.register_tool_function(execute_shell_command)
toolkit.register_tool_function(search_duckduckgo)
```

**支持的工具类型：**
- 🔧 **代码执行工具** - 运行 Python 代码
- 🖥️ **Shell 命令工具** - 执行系统命令
- 🔍 **搜索工具** - 网络搜索、知识库检索
- 📚 **RAG 工具** - 从知识库检索文档
- 🎯 **自定义工具** - 任何 Python 函数

---

### 3. **结构化输出（Structured Output）**

ReActAgent 支持使用 **Pydantic 模型** 来约束输出格式：

```python
from pydantic import BaseModel, Field

# 定义结构化输出模型
class VoteModel(BaseModel):
    vote: str = Field(description="投票目标")
    reason: str = Field(description="投票理由")
    confidence: int = Field(ge=1, le=10, description="信心程度")

# 使用结构化模型
msg = await agent(structured_model=VoteModel)
```

**优势：**
- ✅ 输出格式可预测
- ✅ 便于程序处理
- ✅ 自动验证数据
- ✅ 减少错误

---

### 4. **记忆管理（Memory Management）**

ReActAgent 内置强大的记忆系统：

```python
agent = ReActAgent(
    name="assistant",
    memory=InMemoryMemory(),  # 短期记忆
    long_term_memory=LongTermMemory(),  # 长期记忆（可选）
)
```

**记忆类型：**
- **短期记忆** - 存储对话历史
- **长期记忆** - 持久化存储重要信息
- **自动压缩** - 当记忆过长时自动总结

**记忆模式：**
- `agent_control` - 智能体自主管理记忆
- `static_control` - 固定模式管理记忆
- `both` - 两种模式结合

---

### 5. **实时流式响应（Realtime Streaming）**

支持流式输出，提升用户体验：

```python
model = DashScopeChatModel(
    model_name="qwen-flash",
    stream=True,  # 启用流式响应
)
```

**优势：**
- ✅ 响应更快
- ✅ 用户体验更好
- ✅ 支持实时交互

---

### 6. **并行工具调用（Parallel Tool Calls）**

支持同时调用多个工具：

```python
agent = ReActAgent(
    name="assistant",
    parallel_tool_calls=True,  # 启用并行工具调用
)
```

**示例场景：**
- 同时搜索多个信息源
- 并行执行独立任务
- 提高执行效率

---

### 7. **知识检索增强（RAG Support）**

集成知识库检索能力：

```python
agent = ReActAgent(
    name="assistant",
    knowledge=knowledge_base,  # 知识库
    enable_rewrite_query=True,  # 自动优化查询
)
```

**工作流程：**
1. 用户提问
2. 自动重写查询（优化检索效果）
3. 从知识库检索相关文档
4. 结合检索结果生成回答

---

### 8. **计划与任务分解（Plan Notebook）**

支持复杂任务的分解与执行：

```python
agent = ReActAgent(
    name="assistant",
    plan_notebook=plan_notebook,  # 计划本
)
```

**能力：**
- 📋 任务分解为子任务
- 📊 跟踪任务进度
- 🔄 动态调整计划
- ✅ 复杂任务管理

---

### 9. **自动记忆压缩（Auto Compression）**

当记忆过长时自动总结：

```python
compression_config = ReActAgent.CompressionConfig(
    enable=True,  # 启用压缩
    trigger_threshold=4000,  # 超过 4000 tokens 触发
    keep_recent=3,  # 保留最近 3 条消息
)

agent = ReActAgent(
    name="assistant",
    compression_config=compression_config,
)
```

**压缩后的总结包含：**
- 任务概述
- 当前状态
- 重要发现
- 下一步计划
- 需要保留的上下文

---

### 10. **Hook 机制（扩展点）**

提供多个扩展点，支持自定义行为：

```python
# 在推理前后添加自定义逻辑
agent.register_hook("before_reasoning", custom_function)
agent.register_hook("after_acting", custom_function)
```

**支持的 Hook：**
- `before_reasoning` - 推理前
- `after_reasoning` - 推理后
- `before_acting` - 行动前
- `after_acting` - 行动后
- `before_reply` - 回复前
- `after_reply` - 回复后

---

## 🔧 核心参数说明

### 初始化参数

```python
ReActAgent(
    # 基本信息
    name: str,                    # 智能体名称
    sys_prompt: str,              # 系统提示词
    
    # 模型相关
    model: ChatModelBase,         # 聊天模型
    formatter: FormatterBase,     # 消息格式化器
    
    # 工具相关
    toolkit: Toolkit | None,      # 工具包
    parallel_tool_calls: bool,    # 是否并行调用工具
    enable_meta_tool: bool,       # 是否启用元工具（动态管理工具）
    
    # 记忆相关
    memory: MemoryBase | None,    # 短期记忆
    long_term_memory: LongTermMemoryBase | None,  # 长期记忆
    long_term_memory_mode: str,   # 长期记忆模式
    
    # RAG 相关
    knowledge: KnowledgeBase | list,  # 知识库
    enable_rewrite_query: bool,   # 是否重写查询
    
    # 计划相关
    plan_notebook: PlanNotebook | None,  # 计划本
    
    # 压缩相关
    compression_config: CompressionConfig | None,  # 压缩配置
    
    # 其他
    max_iters: int,               # 最大推理 - 行动循环次数
    print_hint_msg: bool,         # 是否打印提示信息
    tts_model: TTSModelBase | None,  # 语音合成模型
)
```

---

## 📊 在三国狼人杀中的应用

### 1. **角色建模**

```python
# 每个玩家都是一个 ReActAgent
player = ReActAgent(
    name="诸葛亮",
    sys_prompt="你是诸葛亮，在狼人杀游戏中扮演村民...",
    model=DashScopeChatModel(...),
    formatter=DashScopeMultiAgentFormatter(),
)
```

### 2. **结构化输出**

```python
# 投票模型
class VoteModelCN(BaseModel):
    vote: str = Field(description="投票目标玩家姓名")
    reason: str = Field(description="投票理由")
    suspicion_level: int = Field(ge=1, le=10, description="怀疑程度")

# 使用模型
await player(structured_model=VoteModelCN)
```

### 3. **消息传递**

```python
# 通过 MsgHub 进行消息传递
async with MsgHub(participants=players) as hub:
    for player in players:
        await player(structured_model=DiscussionModelCN)
```

### 4. **记忆管理**

```python
# 每个智能体都有自己的记忆
memory = InMemoryMemory(capacity=20)  # 保留最近 20 条消息
```

---

## 🎯 使用建议

### 何时使用 ReActAgent？

✅ **适合的场景：**
- 需要多步推理的复杂任务
- 需要调用外部工具
- 需要可解释的决策过程
- 需要与用户多轮对话
- 需要记忆上下文

❌ **不适合的场景：**
- 简单的一次性问答
- 不需要工具调用
- 对响应速度要求极高

### 最佳实践

1. **明确系统提示词** - 清晰定义角色和任务
2. **合理使用工具** - 只注册必要的工具
3. **控制记忆容量** - 避免记忆过长影响性能
4. **使用结构化输出** - 确保输出格式正确
5. **启用流式响应** - 提升用户体验

---

## 🔍 调试技巧

### 1. 查看推理过程

```python
# 设置 print_hint_msg=True 查看推理提示
agent = ReActAgent(
    name="assistant",
    print_hint_msg=True,  # 打印推理提示
)
```

### 2. 限制循环次数

```python
# 避免无限循环
agent = ReActAgent(
    name="assistant",
    max_iters=10,  # 最多 10 次推理 - 行动循环
)
```

### 3. 使用断点调试

在关键位置设置断点：
- 工具调用前
- 结构化输出验证
- 记忆添加/检索

---

## 📚 相关资源

- **AgentScope 官方文档**: https://modelscope.github.io/agentscope/
- **ReAct 论文**: https://arxiv.org/abs/2210.03629
- **Pydantic 文档**: https://docs.pydantic.dev/

---

**最后更新：** 2026-03-09
