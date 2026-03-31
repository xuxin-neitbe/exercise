---
name: calculator
description: 一个遵循 LLM 函数调用规范的简单计算器技能。支持四种基本算术运算（+、-、*、/），具有除零错误处理和浮点除法功能。当用户需要通过 LLM 函数调用执行算术计算时使用。
license: Complete terms in LICENSE.txt
---

# 计算器技能使用指南

## 概述

这是一个实现 LLM 函数调用规范（Skills）的简单计算器。设计用于通过大语言模型的 Function Calling 功能执行基本算术运算。

**核心特性：**
- ✅ 支持四种基础运算：加法、减法、乘法、除法
- ✅ 除零错误处理
- ✅ 浮点数除法支持
- ✅ 符合 LLM Function Calling 规范
- ✅ 动态 Skills 注册机制

---

## 快速开始

### 1. 使用 Agent 调用

```python
from agent import CalculatorAgent

# 初始化 Agent（自动加载 Skills）
agent = CalculatorAgent(
    model_id="tongyi-xiaomi-analysis-pro",
    api_key="your-api-key",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 处理自然语言查询
result = agent.process_query("计算 5 加 3")
print(result)  # 输出：5 + 3 = 8
```

### 2. 直接使用计算器技能

```python
from calculator.scripts.calculator_impl import calculate

# 加法
result = calculate("add", 5, 3)
# {'operation': 'add', 'a': 5, 'b': 3, 'result': 8}

# 除法（浮点）
result = calculate("divide", 5, 2)
# {'operation': 'divide', 'a': 5, 'b': 2, 'result': 2.5}

# 除法（除零错误）
result = calculate("divide", 10, 0)
# {'error': '不允许除以零', 'operation': 'divide', 'a': 10, 'b': 0}
```

### 3. 命令行交互模式

```bash
python agent.py
```

示例对话：
```
请输入计算问题：计算 5 加 3
结果：5 + 3 = 8

请输入计算问题：10 除以 2
结果：10 / 2 = 5.0

请输入计算问题：5 除以 0
结果：不允许除以零
```

---

## Function Schema

### calculate 函数定义

```json
{
  "name": "calculate",
  "description": "执行基本算术运算：加法、减法、乘法和除法。除以零时返回错误消息。",
  "parameters": {
    "type": "object",
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["add", "subtract", "multiply", "divide"],
        "description": "要执行的算术运算"
      },
      "a": {
        "type": "number",
        "description": "第一个操作数"
      },
      "b": {
        "type": "number",
        "description": "第二个操作数"
      }
    },
    "required": ["operation", "a", "b"]
  }
}
```

---

## 运算操作

| 运算 | 符号 | operation 值 | 描述 | 示例 |
|-----------|--------|--------------|-------------|---------|
| 加法 | + | `add` | 两数相加 | `add(5, 3) = 8` |
| 减法 | - | `subtract` | 两数相减 | `subtract(10, 4) = 6` |
| 乘法 | * | `multiply` | 两数相乘 | `multiply(6, 7) = 42` |
| 除法 | / | `divide` | 浮点除法 | `divide(5, 2) = 2.5` |

---

## 响应格式

### 成功响应

```json
{
  "operation": "<运算类型>",
  "a": <数字>,
  "b": <数字>,
  "result": <数字>
}
```

**示例：**
```json
{
  "operation": "add",
  "a": 5,
  "b": 3,
  "result": 8
}
```

### 错误响应

```json
{
  "error": "<错误消息>",
  "operation": "<运算类型>",
  "a": <数字>,
  "b": <数字>
}
```

**示例（除零错误）：**
```json
{
  "error": "不允许除以零",
  "operation": "divide",
  "a": 10,
  "b": 0
}
```

---

## 实现说明

### 1. 浮点除法

除法运算始终返回浮点数结果：

```python
calculate("divide", 5, 2)   # 2.5 (不是 2)
calculate("divide", 10, 4)  # 2.5
calculate("divide", 7, 2)   # 3.5
```

### 2. 数字类型支持

支持整数和浮点数作为输入：

```python
calculate("add", 5, 3)      # 整数
calculate("add", 5.5, 3.2)  # 浮点数
calculate("add", -5, 3)     # 负数
```

### 3. 精度

使用标准浮点精度（IEEE 754 双精度）：

```python
calculate("divide", 1, 3)  # 0.3333333333333333
```

### 4. 错误处理

仅在除零时返回错误，其他情况（如无效运算）会抛出异常：

```python
# 除零错误
calculate("divide", 10, 0)
# {'error': '不允许除以零', ...}

# 无效运算会抛出 ValueError
calculate("modulus", 10, 3)
# ValueError: 无效的运算类型：modulus
```

---

## 高级用法

### 1. 动态注册 Skills

```python
from agent import CalculatorAgent

# 禁用自动加载
agent = CalculatorAgent(auto_load_skills=False)

# 手动注册 Skill
from calculator.scripts.calculator_impl import calculate, get_tool_schema
agent.register_skill(
    name="calculate",
    func=calculate,
    schema=get_tool_schema()
)
```

### 2. 从配置文件加载

创建 `skills_config.json`：

```json
{
  "skills": [
    {
      "module": "calculator.scripts.calculator_impl",
      "name": "calculate"
    }
  ]
}
```

### 3. 批量执行

```python
operations = [
    ("add", 5, 3),
    ("subtract", 10, 4),
    ("multiply", 6, 7),
    ("divide", 5, 2),
]

for op, a, b in operations:
    result = calculate(op, a, b)
    print(f"{op}({a}, {b}) = {result['result']}")
```

---

## 测试

### 运行完整测试套件

```bash
python test_full.py
```

测试内容：
- ✅ 核心功能测试（4 种运算 + 除零处理）
- ✅ Skills 规范检查（JSON Schema 验证）
- ✅ LLM 集成测试（Function Calling）

### 单独测试组件

```bash
# 测试计算器核心实现
python calculator/scripts/calculator_impl.py

# 测试 Agent 功能
python test_agent.py
```

---

## 项目结构

```
calculator/
├── SKILL.md                 # 技能定义文档
├── .openskills.json         # Skills 配置元数据
├── LICENSE.txt              # 许可证
├── scripts/
│   ├── calculator_impl.py   # 计算器核心实现
│   └── requirements.txt     # Python 依赖
└── reference/
    └── function_schema.json # JSON Schema 定义
```

---

## 依赖要求

### Python 环境

- Python 3.8+
- openai (用于 Agent 功能)

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置 API

设置环境变量：

```bash
# Windows (PowerShell)
$env:DASHSCOPE_API_KEY="sk-xxxxxxxxx"

# Linux/Mac
export DASHSCOPE_API_KEY="sk-xxxxxxxxx"
```

或在代码中配置：

```python
agent = CalculatorAgent(
    api_key="sk-xxxxxxxxx",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)
```

---

## 常见问题

### Q: Skills 是什么？

A: Skills 是 LLM 函数调用的规范格式。通过定义函数 schema，让大模型能够调用外部工具完成特定任务。

### Q: 如何切换模型？

A: 修改 `model_id` 参数即可。支持所有兼容 OpenAI API 格式的模型：

```python
agent = CalculatorAgent(
    model_id="qwen-plus",  # 更换模型
    api_key="your-key"
)
```

### Q: 支持哪些运算？

A: 目前支持加法、减法、乘法、除法四种基础运算。如需扩展，可以：

1. 修改 `calculator_impl.py` 添加新运算
2. 更新 `SKILL.md` 中的 schema 定义
3. 重新注册 Skill

### Q: 如何调试？

A: 启用 debug 日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

日志会显示：
- API 调用详情
- Function Call 参数
- 计算过程
- 错误信息

---

## 资源文件

### reference/

- [`function_schema.json`](./reference/function_schema.json) - calculate 函数的完整 JSON Schema

### scripts/

- [`calculator_impl.py`](./scripts/calculator_impl.py) - 计算器核心实现
- `requirements.txt` - Python 依赖包

---

## 许可证

MIT License。完整条款见 [LICENSE.txt](./LICENSE.txt)

---

## 更新日期

2026-03-12
