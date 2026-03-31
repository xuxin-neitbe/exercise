# 计算器技能 - Skills 规范实现

## 项目概述

本项目通过 **Skills 规范**实现了一个简单计算器，支持 LLM Function Calling 功能。

## 题目要求 ✅

### 已实现功能

- ✅ **4 种基础算术运算**
  - 加法（+）：`add`
  - 减法（-）：`subtract`
  - 乘法（*）：`multiply`
  - 除法（/）：`divide`

- ✅ **除法特殊处理**
  - 除数为 0 时返回错误提示
  - 支持浮点数除法（如 5/2 = 2.5）

- ✅ **命令行交互**
  - 支持自然语言输入
  - 实时显示计算结果

## 项目结构

```
10/
├── calculator/                 # Skills 规范实现
│   ├── SKILL.md              # Skills 规范文档
│   ├── scripts/
│   │   └── calculator_impl.py # 计算器核心实现
│   └── references/
│       └── function_schema.json # JSON Schema 定义
├── agent.py                    # LLM Agent 实现
├── test_agent.py              # Agent 功能测试
├── test_full.py               # 完整测试套件
├── requirements.txt           # 依赖包
└── README.md                  # 项目说明
```

## 环境要求

- Python 3.8+
- DashScope API 访问权限

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置 API

设置环境变量：

```bash
# Windows (PowerShell)
$env:DASHSCOPE_API_KEY="sk-xxxxxxxxx"

# Linux/Mac
export DASHSCOPE_API_KEY="sk-xxxxxxxxx"
```

或在代码中直接配置：

```python
agent = CalculatorAgent(
    model_id="tongyi-xiaomi-analysis-pro",
    api_key="sk-xxxxxxxxx",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    timeout=60
)
```

## 使用方法

### 1. 命令行交互模式

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

### 2. 编程调用

```python
from agent import CalculatorAgent

agent = CalculatorAgent()

# 处理自然语言查询
result = agent.process_query("计算 5 加 3")
print(result)  # 输出：5 + 3 = 8

# 清空对话历史
agent.clear_history()
```

### 3. 直接使用计算器技能

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

## 运行测试

### 完整测试套件

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

## Skills 规范

### Function Schema

```json
{
  "name": "calculate",
  "description": "执行基本算术运算：加法、减法、乘法和除法。除以零时返回错误消息。",
  "parameters": {
    "type": "object",
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["add", "subtract", "multiply", "divide"]
      },
      "a": {"type": "number"},
      "b": {"type": "number"}
    },
    "required": ["operation", "a", "b"]
  }
}
```

### 响应格式

**成功响应：**
```json
{
  "operation": "add",
  "a": 5,
  "b": 3,
  "result": 8
}
```

**错误响应：**
```json
{
  "error": "不允许除以零",
  "operation": "divide",
  "a": 10,
  "b": 0
}
```

## 技术实现

### LLM Function Calling 流程

1. **用户输入** → 自然语言查询（如"计算 5 加 3"）
2. **LLM 分析** → 识别意图并调用 `calculate` 函数
3. **函数执行** → 执行计算并返回结果
4. **LLM 生成回答** → 将结果格式化为自然语言

### Debug 日志

代码中包含完整的 debug 日志，便于调试：

```python
# 初始化日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

日志输出包括：
- API 调用详情
- Function Call 参数
- 计算过程
- 错误信息

## API 配置说明

| 参数 | 值 | 说明 |
|------|-----|------|
| model_id | tongyi-xiaomi-analysis-pro | 通义千问模型 |
| base_url | https://dashscope.aliyuncs.com/compatible-mode/v1 | DashScope 服务地址 |
| timeout | 60 | 超时时间（秒） |

## 测试用例

### 基础运算
- ✅ `add(5, 3) = 8`
- ✅ `subtract(10, 4) = 6`
- ✅ `multiply(6, 7) = 42`
- ✅ `divide(5, 2) = 2.5` (浮点除法)

### 边界情况
- ✅ `divide(10, 0)` → 返回错误
- ✅ `add(-5, 3) = -2` (负数)
- ✅ `divide(7.5, 2.5) = 3.0` (浮点操作数)

## 常见问题

### Q: Skills 是什么？
A: Skills 是 LLM 函数调用的规范格式，通过定义函数 schema 让大模型能够调用外部工具。

### Q: 如何切换模型？
A: 修改 `model_id` 参数即可，支持所有兼容 OpenAI API 格式的模型。

### Q: 支持哪些运算？
A: 目前支持加法、减法、乘法、除法四种基础运算。

## 许可证

MIT License

## 更新日期

2026-03-12
