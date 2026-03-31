# 环境配置指南

## 1. 获取 API 密钥

### OpenAI API（或其他兼容服务）

**选项 A：使用 OpenAI 官方**
- 访问：https://platform.openai.com/api-keys
- 创建 API Key
- 配置：
  ```python
  API_KEY = "sk-..."  # 你的 OpenAI API Key
  BASE_URL = "https://api.openai.com/v1"
  MODEL_ID = "gpt-3.5-turbo"  # 或 "gpt-4"
  ```

**选项 B：使用 Azure OpenAI**
- 访问 Azure Portal 创建资源
- 配置：
  ```python
  API_KEY = "your-azure-key"
  BASE_URL = "https://your-resource.openai.azure.com/openai/deployments/your-deployment"
  MODEL_ID = "your-deployment-name"
  ```

**选项 C：使用 Ollama（本地模型，免费）**
- 安装 Ollama：https://ollama.ai
- 运行模型：`ollama run llama2`
- 配置：
  ```python
  API_KEY = "ollama"  # Ollama 不需要真正的 key
  BASE_URL = "http://localhost:11434/v1"
  MODEL_ID = "llama2"  # 或其他本地模型
  ```

### Tavily API（用于搜索景点）
- 访问：https://app.tavily.com
- 注册并创建 API Key
- 配置：
  ```python
  TAVILY_API_KEY = "tvly-..."  # 你的 Tavily API Key
  ```

## 2. 配置方式

### 方式 A：直接在代码中配置（开发环境）
编辑 [`agent.py`](file:///d:/Projects/5minAI/agent.py) 文件：
```python
API_KEY = "你的 API 密钥"
BASE_URL = "https://api.openai.com/v1"
MODEL_ID = "gpt-3.5-turbo"
TAVILY_API_KEY = "你的 Tavily 密钥"
```

### 方式 B：使用环境变量（推荐，生产环境）
在终端中设置：
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."
$env:BASE_URL="https://api.openai.com/v1"
$env:MODEL_ID="gpt-3.5-turbo"
$env:TAVILY_API_KEY="tvly-..."
```

然后在代码中读取：
```python
API_KEY = os.environ.get("OPENAI_API_KEY")
BASE_URL = os.environ.get("BASE_URL")
MODEL_ID = os.environ.get("MODEL_ID")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
```

## 3. 测试运行

配置完成后，运行：
```bash
python agent.py
```

## 4. 常见问题

### Q: 我没有 API 密钥怎么办？
- **OpenAI**：需要付费账户，但有免费试用额度
- **Ollama**：完全免费，本地运行，但需要较好的硬件
- **Tavily**：有免费层级，足够开发测试使用

### Q: 可以使用其他模型吗？
可以！任何兼容 OpenAI API 格式的服务都可以：
- Anthropic Claude（通过代理）
- Google Gemini（通过代理）
- 国内的文心一言、通义千问等

### Q: 如何降低成本？
- 使用较小的模型（如 gpt-3.5-turbo 而非 gpt-4）
- 限制最大循环次数（`max_iterations` 参数）
- 使用本地模型（Ollama）

## 5. 项目文件结构

```
5minAI/
├── tools.py          # 工具函数（天气查询、景点推荐）
├── llm_client.py     # LLM 客户端封装
├── agent.py          # Agent 主程序
└── config_guide.md   # 本配置文件
```

## 6. 下一步

配置好 API 密钥后，运行 `python agent.py` 即可看到完整的 Agent 工作流程！
