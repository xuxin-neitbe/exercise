# 通义千问 Qwen-Plus 配置完成 ✅

## 📋 配置信息

已成功将通义千问大模型配置添加到项目中：

| 配置项 | 值 |
|--------|-----|
| **模型名称** | `qwen-plus` |
| **API Key** | `sk-262499770a2d4ca9a4217c46d69504c8` |
| **API 端点** | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

---

## 📁 配置文件位置

### 1. 主要配置文件
- **`config.py`** - 统一的配置管理类
  - `DashScopeConfig` - DashScope API 配置
  - `GameConfig` - 游戏配置

### 2. 环境变量文件
- **`.env`** - 实际环境变量配置（已包含你的 API Key）
- **`.env.example`** - 环境变量示例模板

---

## 🔧 使用方法

### 方法 1：使用配置类（推荐）

```python
from config import DashScopeConfig

# 获取模型配置字典
model_config = DashScopeConfig.get_model_config()

# 使用配置
from agentscope.model import DashScopeChatModel
model = DashScopeChatModel(
    model_name=model_config["model_name"],
    api_key=model_config["api_key"],
    base_url=model_config["base_url"],
    temperature=model_config.get("temperature"),
    max_tokens=model_config.get("max_tokens"),
)
```

### 方法 2：直接使用环境变量

```python
import os

api_key = os.environ.get("DASHSCOPE_API_KEY")
model_name = os.environ.get("DASHSCOPE_MODEL", "qwen-plus")
base_url = os.environ.get("DASHSCOPE_BASE_URL")
```

### 方法 3：在 main_cn.py 中已自动使用

项目主文件 [`main_cn.py`](file://d:\Projects\AgentScopeDemo\main_cn.py) 已经更新为使用配置类：

```python
from config import DashScopeConfig

# 在 create_player 方法中自动使用配置
model_config = DashScopeConfig.get_model_config()
agent = ReActAgent(
    name=name,
    sys_prompt=ChinesePrompts.get_role_prompt(role, character),
    model=DashScopeChatModel(**model_config),
    formatter=DashScopeMultiAgentFormatter(),
)
```

---

## ✅ 验证配置

运行以下命令验证配置：

```bash
# 验证配置加载
python verify_config.py

# 测试模型连接
python test_qwen.py
```

---

## 🔐 配置优先级

配置加载的优先级顺序：

1. **环境变量**（最高优先级）
   - `DASHSCOPE_API_KEY`
   - `DASHSCOPE_MODEL`
   - `DASHSCOPE_BASE_URL`

2. **`.env` 文件**（会被 `override=True` 覆盖系统环境变量）

3. **配置文件默认值**（最低优先级）
   - `config.py` 中定义的值

---

## 📝 修改配置

如需修改配置，可以：

### 方式 1：编辑 `.env` 文件
```bash
# 编辑 .env 文件
DASHSCOPE_API_KEY=你的新 API_Key
DASHSCOPE_MODEL=qwen-max  # 或其他模型
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 方式 2：设置系统环境变量
```bash
# Windows PowerShell
$env:DASHSCOPE_API_KEY="你的新 API_Key"

# Linux/Mac
export DASHSCOPE_API_KEY="你的新 API_Key"
```

---

## 🎯 可用模型

通义千问支持的模型：

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| `qwen-plus` | 性能均衡 | 通用场景 ⭐ |
| `qwen-max` | 最强性能 | 复杂任务 |
| `qwen-turbo` | 速度最快 | 简单任务 |
| `qwen-flash` | 轻量级 | 低成本场景 |

---

## 📚 相关文件

- [`config.py`](file://d:\Projects\AgentScopeDemo\config.py) - 配置管理类
- [`.env`](file://d:\Projects\AgentScopeDemo\.env) - 环境变量配置
- [`.env.example`](file://d:\Projects\AgentScopeDemo\.env.example) - 环境变量模板
- [`main_cn.py`](file://d:\Projects\AgentScopeDemo\main_cn.py) - 游戏主文件（已更新使用新配置）
- [`verify_config.py`](file://d:\Projects\AgentScopeDemo\verify_config.py) - 配置验证脚本
- [`test_qwen.py`](file://d:\Projects\AgentScopeDemo\test_qwen.py) - OpenAI SDK 测试脚本

---

## ✨ 下一步

配置已完成，现在可以：

1. ✅ 运行三国狼人杀游戏
2. ✅ 使用 Qwen-Plus 模型进行对话
3. ✅ 开发基于通义千问的 AI 功能

---

**配置时间：** 2026-03-09  
**配置状态：** ✅ 已完成并验证
