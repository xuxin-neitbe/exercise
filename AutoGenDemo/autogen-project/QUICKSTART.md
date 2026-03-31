# 🚀 快速开始指南

> **项目来源：** [Hello-Agents 第六章](https://gitee.com/xinyuan-finance_0/Hello-Agents/tree/main/code/chapter6/AutoGenDemo)  
> **克隆时间：** 2026-03-08

---

## 📦 项目简介

本项目展示了如何使用 AutoGen 构建多智能体协作的软件开发团队，包含：

- **4 个智能体角色**：产品经理、工程师、代码审查员、用户代理
- **完整协作流程**：从需求分析到代码实现
- **实战案例**：比特币价格应用（Streamlit）

---

## 🔧 快速开始（3 步）

### 步骤 1: 安装依赖

```bash
cd autogen-project
pip install -r requirements.txt
```

**依赖包：**
- `autogen-agentchat` - AutoGen 框架核心
- `autogen-ext[openai,azure]` - OpenAI/Azure 扩展
- `streamlit` - 前端界面
- `requests` - HTTP 请求
- `pandas` - 数据处理
- `plotly` - 数据可视化

### 步骤 2: 配置环境变量

```bash
# 复制示例文件
cp .env\ copy .env

# 编辑 .env 文件，填入你的 API 密钥
# Windows: 用记事本打开
# notepad .env
# Linux/Mac: 用编辑器打开
# vim .env
```

**配置内容：**
```bash
LLM_API_KEY=sk-your-api-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_ID=gpt-4
LLM_TIMEOUT=60
```

### 步骤 3: 运行团队协作

```bash
python autogen_software_team.py
```

**预期输出：**
```
🔧 模型客户端初始化
👥 智能体团队创建
🚀 团队协作启动
💬 智能体对话过程...
✅ 协作完成
```

---

## 🎯 运行生成的应用

团队协作完成后，会生成 `output.py` 文件（比特币价格应用）：

```bash
streamlit run output.py
```

**应用功能：**
- ✅ 实时显示比特币当前价格（USD）
- ✅ 显示 24 小时价格变化趋势
- ✅ 提供价格刷新功能
- ✅ 简洁美观的 Streamlit 界面

---

## 👥 智能体角色

| 角色 | 职责 | 特点 |
|------|------|------|
| 🎯 **ProductManager** | 需求分析、技术规划 | 注重用户体验 |
| 💻 **Engineer** | 代码实现、方案设计 | 精通 Python/Streamlit |
| 🔍 **CodeReviewer** | 代码审查、质量检查 | 关注规范和安全 |
| 👤 **UserProxy** | 用户测试、反馈 | 代表用户需求 |

---

## 🔐 环境变量说明

### OpenAI 配置

```bash
LLM_API_KEY=sk-xxx          # OpenAI API 密钥
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_ID=gpt-4          # 或 gpt-3.5-turbo
```

### Azure OpenAI 配置

```bash
LLM_API_TYPE=azure
LLM_API_VERSION=2024-02-15-preview
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
LLM_API_KEY=your-azure-key
```

### 本地模型配置

```bash
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=not-needed
LLM_MODEL_ID=local-model
```

---

## 🐛 常见问题

### Q: 智能体没有开始对话？

**A:** 检查：
1. API Key 是否配置正确
2. 网络连接是否正常
3. 模型名称是否正确

### Q: 协作过程中断？

**A:** 可能原因：
- API 调用限制（检查配额）
- 网络超时
- 模型响应异常

**解决：** 增加 `LLM_TIMEOUT` 值

### Q: 生成的代码无法运行？

**A:** 建议：
1. 检查依赖是否完整安装
2. 验证 API 接口是否可用
3. 查看错误日志

---

## 📚 扩展学习

### 相关章节
- 第四章：智能体经典范式构建
- 第七章：构建你的 Agent 框架
- 第十二章：多智能体协作与通信

### 进阶实践
- 添加更多智能体角色（测试工程师、UI 设计师）
- 实现更复杂的应用场景
- 集成更多工具和 API
- 优化智能体间的协作策略

---

## 🤝 贡献指南

欢迎改进这个项目：
- 报告 Bug 或问题
- 提出新功能建议
- 分享实践经验
- 优化代码实现

---

## 📞 参考资源

- **原项目：** [Hello-Agents on Gitee](https://gitee.com/xinyuan-finance_0/Hello-Agents)
- **AutoGen 文档：** https://microsoft.github.io/autogen/
- **Streamlit 文档：** https://docs.streamlit.io/

---

**最后更新：** 2026-03-08  
**状态：** ✅ 已就绪

🎉 开始你的多智能体协作之旅吧！
