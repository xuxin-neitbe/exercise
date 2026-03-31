# Windows 开发环境配置 Agent

## Agent 概述

这个 Agent 用于在 Windows 系统上自动化检测和配置开发环境镜像，适用于国内网络环境。

## 核心职责

1. **检测现有配置** - 检查开发环境是否已配置
2. **版本统一性检查** - 检查各个语言版本是否符合预期版本
3. **全新环境配置** - 如果是全新环境，执行完整的配置流程
4. **版本修复** - 如果版本不统一，自动升级/降级到预期版本
5. **环境健康检查** - 每次任务前检查开发环境状态

---

## AI 工作守则（核心规则）

> **重要**：接到任何任务后，**第一步永远是执行环境健康检查**！

```
1. 接到任务 → 执行 doctor 检查
2. 分析返回结果
3. 如果有 CRITICAL 问题 → 暂停任务，先修复问题
4. 修复后再次 doctor 检查，直到 status 变为 "OK"
5. 只有环境检查通过后，才能开始执行原始任务
```

---

## 预期版本定义

| 工具 | 预期版本 | 镜像源 | 备注 |
|------|----------|--------|------|
| **Node.js** | 22.x LTS 或 24.x | npmmirror.com | 推荐 LTS 版本 |
| **npm** | (随 Node.js) | npmmirror.com | - |
| **Python** | 3.11.x 或 3.12.x | 清华镜像 | 推荐 3.11.x |
| **pip** | (随 Python) | 清华镜像 | - |
| **Java** | 11.x - 21.x | 阿里云 | 推荐 LTS 版本 |
| **Go** | 1.21.x - 1.25.x | goproxy.cn | 推荐偶数版本 |
| **Rust** | 最新稳定版 | rsproxy.cn | - |
| **Docker** | 最新版 | docker.1ms.run | - |
| **Maven** | (随 IDE) | 阿里云 | - |
| **Gradle** | (随 IDE) | 阿里云 | - |

> **注意**：版本号取当前主流 LTS 版本即可，无需强制统一。关键是配置国内镜像。

---

## 阶段一：环境检测

### 检测脚本

使用项目中的 PowerShell 脚本进行检测：

```powershell
# 检测环境
.\scripts\check-dev-env.ps1

# 配置镜像
.\scripts\setup-china-mirror.ps1
```

详细使用说明见 [scripts/README.md](./scripts/README.md)

---

## 阶段二：版本管理工具集成

### 1. Volta（Node.js 版本管理）

Volta 是一个 Node.js 版本管理工具，可以锁定项目使用的 Node 和 npm 版本。

```powershell
# 安装 Volta
winget install Volta.Volta

# 在项目中锁定 Node.js 和 npm 版本
volta pin node@18
volta pin npm@9
```

这会在 `package.json` 中添加：
```json
{
  "volta": {
    "node": "18.19.0",
    "npm": "9.8.1"
  }
}
```

### 2. pyenv（Python 版本管理）

```powershell
# 安装 pyenv-win
git clone https://github.com/pyenv-win/pyenv-win.git "$env:USERPROFILE\.pyenv"
# 添加到 PATH

# 使用示例
pyenv install 3.11.7
pyenv local 3.11.7
```

---

## 阶段三：项目初始化脚本

### package.json 脚本模板

```json
{
  "scripts": {
    "init": "npm install",
    "dev": "next dev -p 3000",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev -p 3000",
    "dev:clean": "rimraf .next && next dev -p 3000",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --runInBand --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "doctor": "node scripts/doctor.js"
  }
}
```

### Makefile 模板

```makefile
# 开发环境
.PHONY: dev
dev:
	@if [ ! -d ".venv" ]; then echo "❌ .venv not found. Run 'make init' first."; exit 1; fi
	@. .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 初始化
.PHONY: init
init:
	pyenv install --skip-existing
	python -m venv .venv
	.venv\Scripts\activate && pip install -r requirements.txt

# 测试
.PHONY: test
test:
	.venv\Scripts\activate && pytest -q

.PHONY: test:watch
test:watch:
	.venv\Scripts\activate && pytest -q -f

.PHONY: test:ci
test:ci:
	.venv\Scripts\activate && pytest -q --maxfail=1 --disable-warnings --cov=app

# Lint
.PHONY: lint
lint:
	.venv\Scripts\activate && ruff check .

.PHONY: lint:fix
lint:fix:
	.venv\Scripts\activate && ruff check . --fix

# 格式
.PHONY: format
format:
	.venv\Scripts\activate && black --check .

.PHONY: format:write
format:write:
	.venv\Scripts\activate && black .

# 类型检查
.PHONY: typecheck
typecheck:
	.venv\Scripts\activate && mypy app
```

---

## 阶段四：环境健康检查 doctor

### doctor 脚本

使用项目中的 Node.js 脚本进行检测：

```bash
# 使用 npm
npm run doctor

# 或直接运行
node scripts/doctor.js
```

详细使用说明见 [scripts/README.md](./scripts/README.md)

---

## 阶段五：执行配置

### 全新环境判定

满足以下条件视为**全新环境**：
- Node.js 未安装
- Python 未安装
- Java 未安装
- Go 未安装
- Rust 未安装

### 执行配置

运行 `.\scripts\setup-china-mirror.ps1` 并选择选项 9 (Install ALL)

---

## 执行要求

1. **以管理员身份运行 PowerShell**
2. **先执行检测脚本**：`.\scripts\check-dev-env.ps1`
3. **根据报告决定下一步操作**
4. **如需修复，运行**：`.\scripts\setup-china-mirror.ps1`
5. **项目开发前**：运行 `npm run doctor` 检查环境

---

## AI 工作流程

```
┌─────────────────────────────────────────────────────────┐
│                    接到新任务                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         步骤 1: 执行环境健康检查                        │
│         npm run doctor -- --json                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         步骤 2: 分析返回结果                            │
│         检查 status 字段                                │
└─────────────────────┬───────────────────────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
    ┌─────────────┐      ┌─────────────┐
    │ status: OK  │      │ status: WARN│
    │ 或 CRITICAL │      │ 或 CRITICAL │
    └──────┬──────┘      └──────┬──────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐      ┌─────────────────────────────┐
    │ 继续执行    │      │ 步骤 3: 遍历 checks 数组   │
    │ 原始任务    │      │ 执行 suggestion 中的修复命令 │
    └─────────────┘      └──────────────┬──────────────┘
                                        │
                                        ▼
                               ┌─────────────────────┐
                               │ 步骤 4: 再次执行    │
                               │ doctor 检查         │
                               └──────────┬──────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ status 变为 OK? │
                                 └────────┬────────┘
                                          │
                               ┌─────────┴─────────┐
                               │                   │
                               ▼                   ▼
                          继续修复         ┌──────────────┐
                                          │ 继续执行任务 │
                                          └──────────────┘
```
