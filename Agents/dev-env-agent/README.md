# dev-env-agent

Windows 开发环境配置 Agent - 自动化检测和配置开发环境镜像

## 功能

- 一键安装 Node.js、Python、Go、Rust
- 自动配置国内镜像源（npm、pip、Go proxy、Cargo）
- 环境健康检查（doctor）
- 版本统一性检测

## 快速开始

### 1. 检测当前环境

```powershell
# 无需管理员权限
.\scripts\check-dev-env.ps1
```

### 2. 配置开发环境

```powershell
# 管理员模式：安装软件 + 配置镜像（需要管理员）
.\scripts\setup-china-mirror.ps1
# 选择 8 安装全部

# 用户模式：仅配置镜像源（无需管理员）
.\scripts\setup-china-mirror.ps1
# 选择 9 仅配置镜像
```

### 3. 项目健康检查

```bash
# 在项目目录下运行
npm run doctor

# JSON 格式输出（供 AI 使用）
npm run doctor -- --json
```

## 项目结构

```
dev-env-agent/
├── README.md                      # 项目说明文档
├── dev-env-agent.md               # AI 工作守则（工作手册）
└── scripts/
    ├── check-dev-env.ps1          # 环境检测脚本（需管理员）
    ├── setup-china-mirror.ps1     # 主安装脚本（需管理员）
    └── doctor.js                   # 项目健康检查脚本
```

## 预期版本

| 工具 | 预期版本 | 镜像源 |
|------|----------|--------|
| Node.js | 22.x LTS 或 24.x | npmmirror.com |
| npm | (随 Node.js) | npmmirror.com |
| Python | 3.11.x 或 3.12.x | 清华镜像 |
| Java | 11.x - 21.x | 阿里云 |
| Go | 1.21.x - 1.25.x | goproxy.cn |
| Rust | 最新稳定版 | rsproxy.cn |
| Docker | 最新版 | docker.1ms.run |

## AI 工作流程

根据工作手册 `dev-env-agent.md`，AI 在执行任务时应遵循以下流程：

```
1. 接到任务 → 执行 doctor 检查 (npm run doctor -- --json)
2. 分析返回结果
3. 如果有 CRITICAL 问题 → 暂停任务，先修复问题
4. 修复后再次 doctor 检查，直到 status 变为 "OK"
5. 只有环境检查通过后，才能开始执行原始任务
```

## 手动验证命令

```powershell
# 检测环境
node -v
npm config get registry
python --version
python -m pip config list
go version
go env GOPROXY
rustc --version
docker --version
```

## 文档

- [AI 工作守则](dev-env-agent.md) - 详细的 AI 工作流程和规则
- [scripts/README](scripts/README.md) - 脚本使用说明
