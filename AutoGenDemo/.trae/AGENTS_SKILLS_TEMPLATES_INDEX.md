# Vibe Canva - Agents、Skills 和 Templates 索引

> **最后更新：** 2026-03-08  
> **系统版本：** v2.1.0  
> **状态：** ✅ 完整可用

---

## 📊 总览

| 类别 | 数量 | 路径 | 说明 |
|------|------|------|------|
| 🤖 **Agents** | 2 个 | `.trae/agents/` | 决策和协调中心 |
| 🛠️ **Skills** | 5 个 | `.trae/skills/` | 具体执行工具 |
| 📁 **Templates** | 8 个 | `.trae/templates/` | 项目模板库 |

---

## 🤖 Agents（智能体）

### 1. Project Builder Agent

**文件路径：** [`project-builder-agent.md`](file:///d:/Projects/vibe-canva/.trae/agents/project-builder-agent.md)

**触发条件：**
- 用户说"我要创建一个新项目"
- 用户需要全栈项目
- 用户需要 DevOps 配置
- 用户需要部署到阿里云

**核心职责：**
```
1. 信息收集 - 6 步引导式问答
2. 模板复制 - 从模板库复制文件
3. 变量替换 - 批量替换占位符
4. 配置生成 - Docker/CI/CD/K8s
5. Git 初始化 - 创建仓库
6. 文档生成 - README/部署指南
```

**支持的模板类型：**

**🌐 Web 全栈应用（4 个）：**
- Node.js + Express + React ⭐
- Java Spring Boot + Vue 🏢
- Python FastAPI + React 🤖
- Go Gin + Vue ⚡

**🤖 AI 智能体应用（4 个）：**
- AutoGen 多 Agent 协作系统 ⭐（v0.4+ 最新 API）
- LangGraph 工作流系统 🔗（v1.0+）
- AgentScope 聊天机器人 🌟（v1.0+）
- CAMEL 多 Agent 通信系统 🎓（v0.2+）

**交互流程：**
```
第 1 步：项目名称（填空）
第 2 步：项目描述（填空）
第 3 步：项目类型选择（8 选 1）
第 4 步：数据库选择（4 选 1）
第 5 步：部署方式选择（3 选 1）
第 6 步：ACR 配置选择（3 选 1）
→ 确认配置 → 创建项目
```

**详细设计文档：** [查看完整设计](file:///d:/Projects/vibe-canva/.trae/agents/project-builder-agent.md#ai-agent-模板详细设计)

---

### 2. ACR Registry Setup Agent

**文件路径：** [`acr-registry-setup-agent.md`](file:///d:/Projects/vibe-canva/.trae/agents/acr-registry-setup-agent.md)

**触发条件：**
- 用户需要配置 ACR 仓库
- 用户需要推送 Docker 镜像
- 用户需要管理镜像认证

**核心职责：**
```
1. ACR 仓库信息收集
2. 认证配置生成
3. Docker 登录指令
4. 镜像推送脚本
5. 多环境配置
```

**工作流程：**
```
收集 ACR 信息 → 生成认证配置 → 测试连接 → 推送镜像
```

---

## 🛠️ Skills（技能）

### 1. Code Template Skill

**文件路径：** [`SKILL.md`](file:///d:/Projects/vibe-canva/.trae/skills/code-template/SKILL.md)

**职责：** 模板代码复制和变量替换

**输入：**
- 模板路径
- 变量替换规则
- 目标目录

**输出：**
- 完整的项目文件结构
- 变量替换后的代码

**工作流程：**
```
1. 读取模板元数据（metadata.json）
2. 读取变量定义（variables.json）
3. 复制模板文件到目标目录
4. 批量替换变量（3 种规则）
5. 验证文件完整性
```

**变量替换规则：**

| 规则 | 说明 | 示例 |
|------|------|------|
| 精确替换 | 完全匹配占位符 | `{{PROJECT_NAME}}` → `my-app` |
| 正则替换 | 使用正则表达式 | `vite-canva` → `my-app` |
| 条件替换 | 根据条件决定是否替换 | 如果选择 MySQL 则替换 |

**参考文档：**
- [IO 规范](file:///d:/Projects/vibe-canva/.trae/skills/code-template/references/io-spec.md)
- [模板结构](file:///d:/Projects/vibe-canva/.trae/skills/code-template/references/template-structure.md)
- [变量替换规则](file:///d:/Projects/vibe-canva/.trae/skills/code-template/references/variable-rules.md)
- [错误处理](file:///d:/Projects/vibe-canva/.trae/skills/code-template/references/error-handling.md)

---

### 2. Config Generator Skill

**文件路径：** [`SKILL.md`](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/SKILL.md)

**职责：** DevOps 配置文件生成

**生成的配置：**
1. **云效 Flow 流水线** - `flow-yunxiao.yml`
2. **Kubernetes 配置** - Deployments、Services 等
3. **环境变量配置** - `.env` 文件
4. **Docker 配置** - Dockerfile、docker-compose.yml

**工作流程：**
```
1. 读取项目信息
2. 选择配置模板
3. 填充变量
4. 生成配置文件
5. 验证配置正确性
```

**参考文档：**
- [云效 Flow 配置](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/references/flow-config.md)
- [K8s 配置](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/references/k8s-config.md)
- [环境配置](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/references/env-config.md)
- [配置验证](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/references/validation.md)
- [错误处理](file:///d:/Projects/vibe-canva/.trae/skills/config-generator/references/error-handling.md)

---

### 3. Docker Skill

**文件路径：** [`SKILL.md`](file:///d:/Projects/vibe-canva/.trae/skills/docker/SKILL.md)

**职责：** Docker 配置生成和镜像管理

**核心功能：**
- Dockerfile 生成（多阶段构建）
- docker-compose.yml 生成
- ACR 镜像推送配置
- Docker 镜像构建和优化

**生成的文件：**
```dockerfile
# Dockerfile 示例
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

**参考文档：**
- [Dockerfile 模板](file:///d:/Projects/vibe-canva/.trae/skills/docker/references/dockerfile-templates.md)
- [Docker Compose 配置](file:///d:/Projects/vibe-canva/.trae/skills/docker/references/docker-compose.md)
- [ACR 推送](file:///d:/Projects/vibe-canva/.trae/skills/docker/references/acr-push.md)
- [构建指南](file:///d:/Projects/vibe-canva/.trae/skills/docker/references/build-guide.md)
- [错误处理](file:///d:/Projects/vibe-canva/.trae/skills/docker/references/error-handling.md)

---

### 4. K8s Deploy Skill

**文件路径：** [`SKILL.md`](file:///d:/Projects/vibe-canva/.trae/skills/k8s-deploy/SKILL.md)

**职责：** Kubernetes 部署配置和管理

**生成的 K8s 资源：**
- Namespace（命名空间）
- Deployment（部署）
- Service（服务）
- ConfigMap（配置）
- Secrets（密钥）
- PVC（持久化卷）
- Ingress（入口）

**工作流程：**
```
1. 读取项目配置
2. 生成 K8s YAML 文件
3. 验证 YAML 语法
4. 应用配置到集群
5. 验证部署状态
```

**参考文档：**
- [K8s 配置](file:///d:/Projects/vibe-canva/.trae/skills/k8s-deploy/references/k8s-configs.md)
- [部署指南](file:///d:/Projects/vibe-canva/.trae/skills/k8s-deploy/references/deployment-guide.md)
- [验证方法](file:///d:/Projects/vibe-canva/.trae/skills/k8s-deploy/references/verification.md)
- [错误处理](file:///d:/Projects/vibe-canva/.trae/skills/k8s-deploy/references/error-handling.md)

---

### 5. Docs Generator Skill

**文件路径：** [`SKILL.md`](file:///d:/Projects/vibe-canva/.trae/skills/docs-generator/SKILL.md)

**职责：** 项目文档生成

**生成的文档：**
- README.md（项目主文档）
- DEPLOYMENT.md（部署指南）
- API.md（API 文档）
- CONTRIBUTING.md（贡献指南）
- CHANGELOG.md（更新日志）

**文档模板：**

```markdown
# {{PROJECT_NAME}}

> {{PROJECT_DESCRIPTION}}

## 🚀 快速开始

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装
```bash
npm install
```

### 使用
```bash
npm start
```
```

**参考文档：**
- [README 模板](file:///d:/Projects/vibe-canva/.trae/skills/docs-generator/references/readme-template.md)
- [文档模板](file:///d:/Projects/vibe-canva/.trae/skills/docs-generator/references/doc-templates.md)

---

## 📁 Templates（模板库）

### 🌐 Web 全栈应用（4 个）

#### 1. Node.js + Express + React

**模板 ID：** `nodejs-express-react`  
**路径：** [`nodejs-express-react/`](file:///d:/Projects/vibe-canva/.trae/templates/nodejs-express-react)  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐⭐

**技术栈：**
- 后端：Node.js 18+、Express 4.x、TypeScript 5.x
- 前端：React 18、Vite 5.x、TypeScript 5.x
- 数据库：MySQL 8.0
- 容器：Docker、Docker Compose
- 部署：Kubernetes、阿里云 ACK

**文件数：** 33 个  
**代码行数：** ~9,250 行

**核心特性：**
- Monorepo 架构
- 完整 Docker 配置
- K8s 部署文件（11 个 YAML）
- 云效 Flow 流水线
- 产品管理示例代码

**适用场景：**
- 快速开发
- 全栈 JavaScript 项目
- 初创项目
- 原型验证

---

#### 2. Java Spring Boot + Vue

**模板 ID：** `java-springboot-vue`  
**路径：** [`java-springboot-vue/`](file:///d:/Projects/vibe-canva/.trae/templates/java-springboot-vue)  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐⭐

**技术栈：**
- 后端：Java 17、Spring Boot 3.x、MyBatis Plus
- 前端：Vue 3.x、Vite 5.x、Element Plus
- 数据库：MySQL 8.0
- 容器：Docker、Jib
- 部署：Kubernetes、阿里云 ACK

**核心特性：**
- 企业级架构
- RESTful API
- 前后端分离
- 完整 CI/CD

**适用场景：**
- 企业应用
- 复杂业务系统
- 大型项目
- 高可靠性要求

---

#### 3. Python FastAPI + React

**模板 ID：** `python-fastapi-react`  
**路径：** [`python-fastapi-react/`](file:///d:/Projects/vibe-canva/.trae/templates/python-fastapi-react)  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐

**技术栈：**
- 后端：Python 3.11、FastAPI、SQLAlchemy
- 前端：React 18、Vite 5.x、TypeScript
- 数据库：PostgreSQL 15
- 容器：Docker、Docker Compose
- 部署：Kubernetes

**核心特性：**
- 异步优先
- 自动 API 文档
- 数据验证
- AI 生态集成

**适用场景：**
- AI 应用
- 数据分析
- 快速原型
- API 服务

---

#### 4. Go Gin + Vue

**模板 ID：** `go-gin-vue`  
**路径：** [`go-gin-vue/`](file:///d:/Projects/vibe-canva/.trae/templates/go-gin-vue)  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐

**技术栈：**
- 后端：Go 1.21、Gin、GORM
- 前端：Vue 3.x、Vite 5.x、Element Plus
- 数据库：MySQL 8.0
- 容器：Docker、Docker Compose
- 部署：Kubernetes

**核心特性：**
- 高性能
- 低内存占用
- 强并发能力
- 简洁代码

**适用场景：**
- 高并发服务
- 微服务架构
- API 网关
- 实时系统

---

### 🤖 AI 智能体应用（4 个）

#### 5. AutoGen 多 Agent 协作系统

**模板 ID：** `autogen-multi-agent`  
**路径：** [`autogen-multi-agent/`](file:///d:/Projects/vibe-canva/.trae/templates/autogen-multi-agent)  
**框架版本：** **AutoGen v0.4+**（最新 AgentChat API）  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐⭐

**核心组件：**
- Coder Agent（代码编写）
- Reviewer Agent（代码审查）

**工作流：**
- 代码审查工作流
- 结对编程工作流

**API 特性：**
- 异步优先（async-first）
- `AssistantAgent` 类
- `run(task=...)` API
- 资源自动清理

**文件结构：**
```
autogen-multi-agent/
├── main.py                    # 入口
├── agents/
│   ├── coder_agent.py         # Coder Agent
│   └── reviewer_agent.py      # Reviewer Agent
├── workflows/
│   ├── code_review.py         # 代码审查
│   └── pair_programming.py    # 结对编程
└── utils/
    └── llm_helper.py          # LLM 辅助
```

**适用场景：**
- 多 Agent 协作
- 代码自动生成
- 智能助手
- 自动化编程

**详细文档：** [README.md](file:///d:/Projects/vibe-canva/.trae/templates/autogen-multi-agent/README.md)

---

#### 6. LangGraph 工作流系统

**模板 ID：** `langgraph-workflow`  
**路径：** [`langgraph-workflow/`](file:///d:/Projects/vibe-canva/.trae/templates/langgraph-workflow)  
**框架版本：** **LangGraph v1.0+**  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐⭐

**核心组件：**
- StateGraph（状态图）
- MemorySaver（检查点）
- Nodes（Planner、Executor、Reviewer）

**工作流：**
- 规划 - 执行 - 审查循环
- 人机协同（中断点审批）

**API 特性：**
- 图结构编排
- 持久化执行
- 条件分支
- 线程管理

**文件结构：**
```
langgraph-workflow/
├── main.py                    # 入口
├── workflows/
│   ├── planner_executor.py    # 规划 - 执行 - 审查
│   └── human_in_loop.py       # 人机协同
└── requirements.txt
```

**适用场景：**
- 复杂工作流编排
- 企业级自动化
- 长运行任务
- 需要人工审批的流程

**详细文档：** [README.md](file:///d:/Projects/vibe-canva/.trae/templates/langgraph-workflow/README.md)

---

#### 7. AgentScope 聊天机器人

**模板 ID：** `agentscope-chatbot`  
**路径：** [`agentscope-chatbot/`](file:///d:/Projects/vibe-canva/.trae/templates/agentscope-chatbot)  
**框架版本：** **AgentScope v1.0+**  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐

**核心组件：**
- ReActAgent（ReAct 模式智能体）
- Tools（工具集）
- Memory（记忆管理）

**内置工具：**
- `execute_python_code` - 执行 Python 代码
- `execute_shell_command` - 执行 Shell 命令
- `search_duckduckgo` - 网络搜索

**API 特性：**
- ReAct 架构（Reasoning + Acting）
- 流式响应
- 多模型支持（DashScope、OpenAI）
- 对话历史管理

**文件结构：**
```
agentscope-chatbot/
├── main.py                    # 入口
├── agents/
│   └── __init__.py            # Agent 工厂
├── config/
│   └── model_config.json      # 模型配置
└── requirements.txt
```

**适用场景：**
- 对话系统
- 客服机器人
- 智能助手
- 企业客服

**详细文档：** [README.md](file:///d:/Projects/vibe-canva/.trae/templates/agentscope-chatbot/README.md)

---

#### 8. CAMEL 多 Agent 通信系统

**模板 ID：** `camel-multi-agent`  
**路径：** [`camel-multi-agent/`](file:///d:/Projects/vibe-canva/.trae/templates/camel-multi-agent)  
**框架版本：** **CAMEL v0.2+**  
**状态：** ✅ Active  
**推荐度：** ⭐⭐⭐⭐

**核心组件：**
- ChatAgent（基础聊天智能体）
- Role-Playing（角色扮演）
- ModelFactory（模型工厂）

**场景模式：**
1. **角色扮演** - 两个 Agent 扮演不同角色对话
2. **数据生成** - Generator + Validator 双 Agent 协作
3. **任务自动化** - Planner + Executor + Reviewer 三 Agent 协作

**API 特性：**
- 多智能体通信
- 角色设定
- 自主协作
- 对话历史追踪

**文件结构：**
```
camel-multi-agent/
├── main.py                    # 入口
├── scenarios/
│   ├── role_playing.py        # 角色扮演
│   ├── data_generation.py     # 数据生成
│   └── task_automation.py     # 任务自动化
└── requirements.txt
```

**适用场景：**
- 多 Agent 通信研究
- 数据生成
- 世界模拟
- 实验性项目

**详细文档：** [README.md](file:///d:/Projects/vibe-canva/.trae/templates/camel-multi-agent/README.md)

---

## 🎯 快速选择指南

### 选择 Web 模板？

**需要快速开发、全栈 JavaScript？**  
→ 选择 **Node.js + Express + React** ⭐

**企业应用、复杂业务？**  
→ 选择 **Java Spring Boot + Vue** 🏢

**AI 应用、数据分析？**  
→ 选择 **Python FastAPI + React** 🤖

**高并发、微服务？**  
→ 选择 **Go Gin + Vue** ⚡

### 选择 AI Agent 模板？

**多 Agent 协作、代码生成？**  
→ 选择 **AutoGen 多 Agent 协作系统** ⭐

**复杂工作流、企业自动化？**  
→ 选择 **LangGraph 工作流系统** 🔗

**对话系统、客服机器人？**  
→ 选择 **AgentScope 聊天机器人** 🌟

**多 Agent 通信研究、数据生成？**  
→ 选择 **CAMEL 多 Agent 通信系统** 🎓

---

## 📈 系统架构

```
┌─────────────────────────────────────────────┐
│              用户请求                        │
└────────────────────┬────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────┐
│        Project Builder Agent                │
│  （决策和协调中心）                           │
│  - 6 步引导式问答                            │
│  - 模板选择                                  │
│  - Skills 调度                               │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│              Skills 执行层                   │
│  ┌─────────────────────────────────────┐   │
│  │ Code Template Skill                 │   │
│  │ - 模板复制                           │   │
│  │ - 变量替换                           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Config Generator Skill              │   │
│  │ - Flow 流水线                        │   │
│  │ - K8s 配置                           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Docker Skill                        │   │
│  │ - Dockerfile                        │   │
│  │ - docker-compose.yml                │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ K8s Deploy Skill                    │   │
│  │ - K8s 资源文件                       │   │
│  │ - 部署验证                           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Docs Generator Skill                │   │
│  │ - README.md                         │   │
│  │ - 部署文档                           │   │
│  └─────────────────────────────────────┘   │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│           Templates 模板库                   │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Web 模板 (4)  │  │ AI 模板 (4)   │        │
│  │ - Node.js    │  │ - AutoGen    │        │
│  │ - Java       │  │ - LangGraph  │        │
│  │ - Python     │  │ - AgentScope │        │
│  │ - Go         │  │ - CAMEL      │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│          输出：完整项目                      │
│  - 源代码                                   │
│  - Docker 配置                              │
│  - K8s 配置                                 │
│  - CI/CD 流水线                            │
│  - 完整文档                                 │
└─────────────────────────────────────────────┘
```

---

## 📝 使用示例

### 示例 1：创建 Node.js 全栈项目

```
用户：我要创建一个新项目

Agent: 好的！请告诉我项目名称。
💡 提示格式：my-awesome-app

用户：my-shop

Agent: 很好！现在请用一句话描述项目。
💡 提示：在线商城系统

用户：在线商城系统，支持产品管理和订单处理

Agent: 请选择项目类型：

📁 **Web 全栈应用**
1️⃣ Node.js + Express + React（推荐 ⭐）
2️⃣ Java Spring Boot + Vue（企业首选 🏢）
3️⃣ Python FastAPI + React（AI/数据科学 🤖）
4️⃣ Go Gin + Vue（高性能 ⚡）

用户：1

Agent: 好的！选择 Node.js + React 技术栈。
接下来选择数据库：
1️⃣ MySQL（推荐）
2️⃣ PostgreSQL（高级功能）
3️⃣ MongoDB（灵活数据）
4️⃣ 不需要数据库

用户：1

Agent: 收到！使用 MySQL 数据库。
选择部署方式：
1️⃣ 阿里云 ACK（推荐）
2️⃣ 阿里云 ECS（传统部署）
3️⃣ 暂不部署（仅本地开发）

用户：1

Agent: 好的！部署到阿里云 ACK。
最后配置 ACR：
1️⃣ 使用默认配置（推荐）
2️⃣ 自定义配置
3️⃣ 跳过（稍后配置）

用户：1

Agent: ✅ 配置确认：
- 项目名称：my-shop
- 项目描述：在线商城系统
- 技术栈：Node.js + React
- 数据库：MySQL
- 部署：阿里云 ACK
- ACR：默认配置

准备好了吗？我将创建完整的项目...

用户：yes

Agent: 🚀 开始创建...
✅ 完成！项目已创建在：d:\Projects\my-shop
```

### 示例 2：创建 AutoGen 多 Agent 系统

```
用户：我想创建一个多 Agent 协作的项目

Agent: 好的！我推荐使用 AutoGen 多 Agent 协作系统。
这是微软出品的强大框架，支持：
- Coder Agent + Reviewer Agent 协作
- 代码审查工作流
- 结对编程工作流
- 支持 OpenAI/Azure/Local LLM

请输入项目名称：

用户：code-assistant

Agent: 很好！现在请选择工作模式：
1️⃣ 代码审查模式
2️⃣ 结对编程模式
3️⃣ 自定义模式

用户：1

Agent: ✅ 收到！创建代码审查模式的多 Agent 系统。
需要配置 LLM 吗？
1️⃣ 使用 OpenAI（推荐）
2️⃣ 使用 Azure OpenAI
3️⃣ 使用本地模型
4️⃣ 稍后配置

用户：1

Agent: 好的！使用 OpenAI。
请输入 OpenAI API Key（或稍后在.env 中配置）：

用户：sk-xxx

Agent: 🚀 开始创建...
✅ 完成！项目已创建在：d:\Projects\code-assistant

运行方式：
cd code-assistant
pip install -r requirements.txt
python main.py
```

---

## 🔗 相关文档

- [项目进度追踪](file:///d:/Projects/vibe-canva/.trae/PROJECT_PROGRESS.md)
- [AI Agent 模板开发总结](file:///d:/Projects/vibe-canva/.trae/AI_AGENT_TEMPLATES_SUMMARY.md)
- [项目完成总结](file:///d:/Projects/vibe-canva/.trae/FINAL_PROJECT_REPORT.md)
- [主项目 README](file:///d:/Projects/vibe-canva/README.md)

---

## 📊 统计信息

| 指标 | 数量 |
|------|------|
| Agents | 2 |
| Skills | 5 |
| Templates | 8 |
| Web 模板 | 4 |
| AI Agent 模板 | 4 |
| 参考文档 | 20+ |
| 模板文件 | ~70 |
| 代码行数 | ~5000 |
| 文档行数 | ~2500 |

---

**最后更新：** 2026-03-08  
**维护者：** Vibe Canva Team  
**许可证：** MIT
