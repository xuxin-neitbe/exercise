# Scripts 说明

本目录包含 dev-env-agent 的核心脚本。

## 脚本列表

| 脚本 | 说明 | 需要管理员 |
|------|------|------------|
| `check-dev-env.ps1` | 环境检测脚本 | ✅ 是 |
| `setup-china-mirror.ps1` | 主安装/配置脚本 | ✅ 是 |
| `doctor.js` | 项目健康检查脚本 | ❌ 否 |

## check-dev-env.ps1

检测当前开发环境配置状态。

### 使用方法

```powershell
# 以管理员身份运行 PowerShell
cd D:\Projects\Agents\dev-env-agent\scripts
.\check-dev-env.ps1
```

### 检测项

- **Node.js**：版本检查 + npm 镜像配置
- **Python**：版本检查 + pip 镜像配置
- **Go**：版本检查 + GOPROXY 配置
- **Rust**：安装检查 + Cargo 配置
- **Docker**：安装检查 + daemon.json 配置

### 输出示例

```
========================================
  Windows Dev Environment Checker
========================================

[Node.js]
  Version: 22.14.0
  Registry: https://registry.npmmirror.com
...
```

---

## setup-china-mirror.ps1

一键安装开发环境并配置国内镜像。

### 使用方法

```powershell
# 以管理员身份运行 PowerShell
cd D:\Projects\Agents\dev-env-agent\scripts
.\setup-china-mirror.ps1
```

### 菜单选项

| 选项 | 功能 |
|------|------|
| 1 | 安装 Node.js + npm 镜像 |
| 2 | 安装 Python + pip 镜像 |
| 3 | 安装 Java (JDK) |
| 4 | 安装 Go + Go proxy |
| 5 | 安装 Rust + Cargo 镜像 |
| 6 | 配置 Docker 镜像 |
| 7 | 配置 Maven 镜像 |
| 8 | 配置 Gradle 镜像 |
| 9 | 安装全部（需管理员）|
| 0 | 退出 |

### 安装内容

- **Node.js 22.x**：npmmirror.com
- **Python 3.11.x**：清华镜像
- **Java 21.x**：阿里云
- **Go 1.23.x**：goproxy.cn
- **Rust**：rsproxy.cn
- **Docker**：docker.1ms.run
- **Maven**：阿里云
- **Gradle**：阿里云

---

## doctor.js

项目级健康检查脚本，适合在项目中集成。

### 前置要求

需要安装 chalk 包：

```bash
npm install chalk
```

### 使用方法

```bash
# 人类可读格式
npm run doctor
# 或
node scripts/doctor.js

# JSON 格式（供 AI 分析）
npm run doctor -- --json
```

### 检测项

- **Node.js 版本**：检查是否匹配 package.json 中的 volta 配置
- **依赖同步**：检查 package-lock.json 是否与 package.json 一致
- **Docker 服务**：检查 Docker 是否运行
- **Git 仓库**：检查是否已初始化

### 输出格式

人类可读格式：
```
🩺 环境健康检查...

[✅] Node.js Version: v22.14.0
[✅] Dependencies: 已同步
[⚠️] Docker Service: 未运行
   - 建议: 启动 Docker Desktop
[✅] Git Repository: 已初始化

--- JSON Output ---

{
  "status": "WARN",
  "checks": [...]
}
```

JSON 格式：
```json
{
  "status": "WARN",
  "checks": [
    {
      "name": "Node.js Version",
      "status": "OK",
      "message": "v22.14.0",
      "suggestion": null
    }
  ]
}
```

### 集成到 package.json

```json
{
  "scripts": {
    "doctor": "node scripts/doctor.js"
  }
}
```

---

## 常见问题

### 1. 权限问题

脚本支持两种模式：

| 模式 | 说明 | 需要管理员 |
|------|------|------------|
| 管理员模式 | 完整功能：安装软件 + 配置镜像 | ✅ 是 |
| 用户模式 | 仅配置镜像源，不安装软件 | ❌ 否 |

**如何选择：**
- 首次使用 → 管理员模式（选项 8）
- 已有软件 → 用户模式（选项 9）

### 2. 路径问题

错误示例：`.\D:\Projects\...`
正确示例：`D:\Projects\...` 或先 cd 到目录

### 3. doctor.js 依赖

确保已安装 chalk：
```bash
npm install chalk
```
