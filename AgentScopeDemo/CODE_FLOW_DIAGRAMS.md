# 三国狼人杀代码流程图说明

本文档包含三个代码运行流程图，帮助你理解和跟踪代码执行流程。

---

## 📊 流程图列表

### 1️⃣ **完整游戏流程图** - `game_flowchart.png`

**文件位置**: `d:\Projects\AgentScopeDemo\game_flowchart.png`

**内容**: 展示从程序入口到游戏结束的完整流程

**包含的主要阶段**:
- ✅ 程序入口 (`main_cn.py:389`)
- ✅ 环境检查
- ✅ 游戏设置 (`setup_game`)
- ✅ 玩家创建 (`create_player` + `ReActAgent`)
- ✅ 游戏主循环 (10 轮)
- ✅ 夜晚阶段 (狼人/预言家/女巫)
- ✅ 白天阶段 (讨论/投票/猎人技能)
- ✅ 胜利条件检查

**颜色说明**:
- 🟢 **绿色**: 开始/结束节点
- 🔵 **蓝色**: 处理步骤
- 🟡 **黄色**: 决策节点 (判断/条件)
- 🟣 **紫色**: Agent 相关操作
- 🟠 **橙色**: 游戏阶段
- 🔴 **红色**: 错误处理

---

### 2️⃣ **ReAct Agent 内部流程图** - `react_agent_flowchart.png`

**文件位置**: `d:\Projects\AgentScopeDemo\react_agent_flowchart.png`

**内容**: 详细展示 ReActAgent 的"推理 - 行动"循环机制

**包含的主要模块**:
- 📥 输入处理
- 💾 记忆管理 (短期/长期/知识库)
- 🤔 推理过程 (`_reasoning`)
  - 提示词格式化
  - LLM 调用
  - 流式输出处理
- 🔧 行动过程 (`_acting`)
  - 工具调用
  - 结果处理
- 🔄 推理 - 行动循环
- 📤 输出处理

**关键特性**:
- 结构化输出支持
- 并行工具调用
- 记忆压缩
- 用户中断处理

---

### 3️⃣ **简化游戏循环图** - `game_loop_simple.png`

**文件位置**: `d:\Projects\AgentScopeDemo\game_loop_simple.png`

**内容**: 简化版的游戏循环流程图

**流程**:
```
开始 → 夜晚阶段 → 检查胜利 → 白天阶段 → 检查胜利 → 下一轮
         ↓                          ↓
      游戏结束                   最大轮数结束
```

**阶段说明**:
- 🌙 **夜晚阶段**: 狼人击杀 → 预言家查验 → 女巫用药
- ☀️ **白天阶段**: 公告 → 讨论 → 投票 → 猎人技能

---

## 🎯 如何使用这些流程图

### 方法 1: 按执行顺序跟踪

1. **从入口开始**: 打开 `game_flowchart.png`
2. **理解主循环**: 跟随流程从 `main()` → `run_game()` → 各阶段
3. **深入 Agent**: 当看到 `ReActAgent` 时，参考 `react_agent_flowchart.png`
4. **快速回顾**: 使用 `game_loop_simple.png` 快速回忆整体流程

### 方法 2: 按功能模块学习

**游戏逻辑模块**:
- 主要看 `game_flowchart.png` 和 `game_loop_simple.png`
- 关注各个阶段的方法调用

**Agent 智能体模块**:
- 主要看 `react_agent_flowchart.png`
- 理解 ReAct 模式的推理 - 行动循环

**记忆系统模块**:
- 查看 `react_agent_flowchart.png` 中的记忆管理部分
- 理解短期记忆、长期记忆、知识库的协作

### 方法 3: 调试时使用

**定位问题**:
1. 根据错误信息确定问题阶段
2. 在流程图中找到对应节点
3. 查看前后节点，理解上下文
4. 在对应代码位置添加断点

**示例**:
```
如果错误发生在"狼人讨论"阶段:
1. 在 game_flowchart.png 中找到 werewolf_phase
2. 查看其前置条件 (夜晚阶段开始)
3. 查看其后置步骤 (更新死亡玩家)
4. 在 main_cn.py:123 添加断点调试
```

---

## 📁 关键代码文件索引

| 文件名 | 主要功能 | 关键行号 |
|--------|---------|---------|
| [`main_cn.py`](file:///d:/Projects/AgentScopeDemo/main_cn.py) | 游戏主逻辑 | 389 (入口), 317 (主循环), 88 (设置) |
| [`prompt_cn.py`](file:///d:/Projects/AgentScopeDemo/prompt_cn.py) | 提示词定义 | 8 (角色提示词) |
| [`structured_output_cn.py`](file:///d:/Projects/AgentScopeDemo/structured_output_cn.py) | 结构化输出模型 | 全文 |
| [`utils_cn.py`](file:///d:/Projects/AgentScopeDemo/utils_cn.py) | 工具函数 | 投票、胜利检查等 |
| [`config.py`](file:///d:/Projects/AgentScopeDemo/config.py) | 配置文件 | 13 (DashScope 配置) |
| [`game_roles.py`](file:///d:/Projects/AgentScopeDemo/game_roles.py) | 角色定义 | 全文 |

---

## 🔍 ReAct Agent 关键特性

从 `react_agent_flowchart.png` 中可以看到的特性:

### 1. 推理 - 行动循环
```
推理 (_reasoning) → 检查工具调用 → 行动 (_acting) → 检查结果 → 继续循环
```

### 2. 记忆管理
- **短期记忆**: 对话历史
- **长期记忆**: 持久化存储
- **知识库**: RAG 检索
- **记忆压缩**: 自动压缩旧记忆

### 3. 工具调用
- **并行调用**: 支持同时执行多个工具
- **流式输出**: 实时显示工具执行结果
- **错误处理**: 捕获并处理工具执行错误

### 4. 结构化输出
- **Pydantic 模型**: 验证输出格式
- **强制工具调用**: 确保生成结构化数据
- **元数据缓存**: 保存结构化结果

---

## 💡 学习建议

### 初学者路线
1. 先看 `game_loop_simple.png` 理解游戏循环
2. 再看 `game_flowchart.png` 了解完整流程
3. 最后看 `react_agent_flowchart.png` 深入 Agent 内部

### 调试路线
1. 根据错误定位到具体流程图
2. 找到对应的代码文件和行号
3. 在关键节点添加断点
4. 对照流程图跟踪变量变化

### 优化路线
1. 分析流程图中的瓶颈环节
2. 识别可优化的循环和判断
3. 考虑并发处理的可能性
4. 优化记忆管理和检索策略

---

## 📌 常见问题

**Q: 如何跟踪某个特定玩家的行动？**
A: 在 `game_flowchart.png` 中找到 `create_player` 节点，追踪该 Agent 在各个阶段的调用。

**Q: ReAct Agent 何时会退出循环？**
A: 查看 `react_agent_flowchart.png` 中的决策节点：
- 没有工具调用且结构化输出完成
- 达到最大迭代次数 (10 次)

**Q: 如何修改游戏逻辑？**
A: 
1. 在流程图中找到要修改的阶段
2. 定位到对应的代码文件
3. 修改后检查流程图是否需要更新
4. 测试修改是否影响其他阶段

---

## 📚 相关资源

- **AgentScope 文档**: https://agentscope.io/
- **ReAct 论文**: https://arxiv.org/abs/2210.03629
- **Mermaid 语法**: https://mermaid.js.org/syntax/flowchart.html

---

**最后更新**: 2026-03-10  
**生成工具**: MCP Mermaid Diagram Generator
