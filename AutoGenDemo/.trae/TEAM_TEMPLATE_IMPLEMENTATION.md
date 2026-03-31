# 团队模板仓库实施指南

> **目标：** 将 `.trae` 配置作为团队标准，所有项目统一使用
> 
> **适用场景：** 团队协作、多项目管理、企业标准化

---

## 🎯 方案概述

将当前的 `.trae` 目录提取为独立的 Git 仓库，作为团队模板仓库。新项目通过复制、Git 子模块或模板引擎的方式继承配置。

### 核心思路

```
vibe-canva/.trae  →  独立 Git 仓库  →  所有项目继承
     ↓                    ↓                  ↓
  源模板仓库          团队配置中心        项目配置
```

---

## 📋 实施步骤

### 步骤 1：提取 .trae 为独立仓库

#### 1.1 创建新仓库

**在 Git 平台（GitHub/Gitee/码云）创建新仓库：**

```bash
# 仓库名称建议
- vibe-canva-templates          # 模板仓库
- team-trae-config             # 团队配置
- project-builder-templates    # 项目构建模板
```

**示例：创建 `vibe-canva-templates` 仓库**

```bash
# 1. 在代码平台创建空仓库
# 例如：https://codeup.aliyun.com/your-org/vibe-canva-templates

# 2. 克隆空仓库
cd d:\Projects
git clone https://codeup.aliyun.com/your-org/vibe-canva-templates.git
cd vibe-canva-templates

# 3. 复制 .trae 内容
xcopy /E /I d:\Projects\vibe-canva\.trae\* .

# 4. 创建 README.md
# 5. 提交并推送
git add .
git commit -m "feat: 初始版本 - Vibe Canva 模板和配置"
git push origin main
```

#### 1.2 优化目录结构

**建议的仓库结构：**

```
vibe-canva-templates/
├── README.md                    # 使用说明
├── CHANGELOG.md                 # 版本更新日志
├── LICENSE                      # 许可证
│
├── agents/                      # Agents 配置
│   ├── project-builder-agent.md
│   └── acr-registry-setup-agent.md
│
├── skills/                      # Skills 配置
│   ├── registry.json           # Skills 注册表
│   ├── code-template/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── config-generator/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── docker/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── k8s-deploy/
│   │   ├── SKILL.md
│   │   └── references/
│   └── docs-generator/
│       ├── SKILL.md
│       └── references/
│
├── templates/                   # 项目模板
│   ├── registry.json           # 模板注册表
│   ├── nodejs-express-react/
│   ├── java-springboot-vue/
│   ├── python-fastapi-react/
│   ├── go-gin-vue/
│   ├── autogen-multi-agent/
│   ├── langgraph-workflow/
│   ├── agentscope-chatbot/
│   └── camel-multi-agent/
│
├── config/                      # 通用配置
│   ├── default-config.json     # 默认配置
│   ├── team-settings.json      # 团队设置
│   └── examples/               # 使用示例
│
└── scripts/                     # 工具脚本
    ├── install.ps1             # Windows 安装脚本
    ├── install.sh              # Linux/Mac安装脚本
    └── update.ps1              # 更新脚本
```

#### 1.3 创建 README.md

```markdown
# Vibe Canva Templates

> 团队项目模板和 Trae 配置中心

## 📦 内容

- 🤖 **2 个 Agents** - Project Builder、ACR Registry Setup
- 🛠️ **5 个 Skills** - Code Template、Config Generator、Docker、K8s Deploy、Docs Generator
- 📁 **8 个 Templates** - 4 个 Web 全栈 + 4 个 AI Agent

## 🚀 快速开始

### 方式一：Git 子模块（推荐）

```bash
# 在新项目中
git submodule add https://codeup.aliyun.com/your-org/vibe-canva-templates.git .trae
git submodule update --init
```

### 方式二：复制模板

```bash
# 使用安装脚本
curl -sSL https://codeup.aliyun.com/your-org/vibe-canva-templates/raw/main/scripts/install.sh | bash

# 或手动复制
git clone https://codeup.aliyun.com/your-org/vibe-canva-templates.git
xcopy /E /I vibe-canva-templates my-new-project\.trae
```

### 方式三：使用 CLI 工具

```bash
# 安装
npm install -g @your-org/vibe-canva-cli

# 创建项目
vibe create nodejs-express-react my-app
```

## 📖 使用文档

- [完整使用指南](./docs/USAGE.md)
- [Skills 文档](./skills/)
- [Templates 文档](./templates/)
- [Agents 文档](./agents/)

## 🔄 更新

```bash
# 更新子模块
git submodule update --remote .trae

# 或使用更新脚本
.\.trae\scripts\update.ps1
```

## 👥 团队使用

所有团队成员都应该：
1. 使用相同版本的模板
2. 定期同步更新
3. 贡献改进到模板仓库

## 📄 许可证

MIT License
```

#### 1.4 创建安装脚本

**Windows PowerShell 安装脚本 (`scripts/install.ps1`)：**

```powershell
# install.ps1
param(
    [string]$TargetPath = ".",
    [string]$TemplateRepo = "https://codeup.aliyun.com/your-org/vibe-canva-templates.git"
)

Write-Host "🚀 Vibe Canva 模板安装脚本" -ForegroundColor Green
Write-Host "目标路径：$TargetPath" -ForegroundColor Yellow

# 1. 克隆模板仓库
Write-Host "`n📦 克隆模板仓库..." -ForegroundColor Cyan
git clone $TemplateRepo "$TargetPath\.trae"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 克隆失败" -ForegroundColor Red
    exit 1
}

# 2. 创建项目配置文件
Write-Host "`n⚙️ 创建项目配置..." -ForegroundColor Cyan
$tracConfig = @"
{
  "version": "1.0.0",
  "extends": ".trae",
  "agents": ["project-builder"],
  "skills": [
    "code-template",
    "config-generator",
    "docker",
    "k8s-deploy",
    "docs-generator"
  ],
  "templates": {
    "source": ".trae/templates"
  }
}
"@

$tracConfig | Out-File -FilePath "$TargetPath\.trae\project-config.json" -Encoding utf8

# 3. 验证安装
Write-Host "`n✅ 验证安装..." -ForegroundColor Green
$requiredFiles = @(
    ".trae\agents\project-builder-agent.md",
    ".trae\skills\registry.json",
    ".trae\templates\registry.json"
)

$allGood = $true
foreach ($file in $requiredFiles) {
    if (Test-Path "$TargetPath\$file") {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (缺失)" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n🎉 安装成功！" -ForegroundColor Green
    Write-Host "`n使用方式：" -ForegroundColor Yellow
    Write-Host "  1. 在项目中打开 Trae" -ForegroundColor White
    Write-Host "  2. 输入：@project-builder 创建项目" -ForegroundColor White
    Write-Host "  3. 按照引导完成项目创建" -ForegroundColor White
} else {
    Write-Host "`n⚠️  安装有问题，请检查" -ForegroundColor Yellow
}
```

**Linux/Mac 安装脚本 (`scripts/install.sh`)：**

```bash
#!/bin/bash

# install.sh
REPO_URL="https://codeup.aliyun.com/your-org/vibe-canva-templates.git"
TARGET_DIR="${1:-.}"

echo "🚀 Vibe Canva 模板安装脚本"
echo "目标路径：$TARGET_DIR"

# 克隆模板仓库
echo -e "\n📦 克隆模板仓库..."
git clone $REPO_URL "$TARGET_DIR/.trae"

if [ $? -ne 0 ]; then
    echo "❌ 克隆失败"
    exit 1
fi

# 创建项目配置文件
echo -e "\n⚙️ 创建项目配置..."
cat > "$TARGET_DIR/.trae/project-config.json" << 'EOF'
{
  "version": "1.0.0",
  "extends": ".trae",
  "agents": ["project-builder"],
  "skills": [
    "code-template",
    "config-generator",
    "docker",
    "k8s-deploy",
    "docs-generator"
  ],
  "templates": {
    "source": ".trae/templates"
  }
}
EOF

# 验证安装
echo -e "\n✅ 验证安装..."
required_files=(
    ".trae/agents/project-builder-agent.md"
    ".trae/skills/registry.json"
    ".trae/templates/registry.json"
)

all_good=true
for file in "${required_files[@]}"; do
    if [ -f "$TARGET_DIR/$file" ]; then
        echo "  ✓ $file"
    } else {
        echo "  ✗ $file (缺失)"
        all_good=false
    }
done

if [ "$all_good" = true ]; then
    echo -e "\n🎉 安装成功！"
    echo -e "\n使用方式："
    echo "  1. 在项目中打开 Trae"
    echo "  2. 输入：@project-builder 创建项目"
    echo "  3. 按照引导完成项目创建"
else
    echo -e "\n⚠️  安装有问题，请检查"
fi
```

---

### 步骤 2：新项目使用模板

#### 方式一：Git 子模块（推荐 ⭐⭐⭐⭐⭐）

**优点：**
- ✅ 易于同步更新
- ✅ 版本可控
- ✅ 团队统一
- ✅ 自动关联

**使用步骤：**

```bash
# 1. 创建新项目
mkdir my-new-project
cd my-new-project

# 2. 初始化为 Git 仓库
git init

# 3. 添加模板仓库为子模块
git submodule add https://codeup.aliyun.com/your-org/vibe-canva-templates.git .trae

# 4. 初始化子模块
git submodule update --init

# 5. 创建项目配置文件
cat > .trae-config.json << 'EOF'
{
  "version": "1.0.0",
  "extends": ".trae",
  "agents": ["project-builder"],
  "skills": ["all"],
  "templates": {
    "source": ".trae/templates"
  }
}
EOF

# 6. 提交配置
git add .trae .trae-config.json
git commit -m "feat: 添加团队模板配置"
```

**后续更新：**

```bash
# 更新模板到最新版本
git submodule update --remote .trae

# 查看模板状态
git submodule status

# 拉取团队最新配置
git submodule foreach git pull origin main
```

**团队成员使用：**

```bash
# 克隆项目（包含子模块）
git clone --recursive https://codeup.aliyun.com/your-org/my-new-project.git

# 或克隆后手动初始化
git clone https://codeup.aliyun.com/your-org/my-new-project.git
cd my-new-project
git submodule init
git submodule update
```

---

#### 方式二：使用安装脚本（简单 ⭐⭐⭐⭐）

**优点：**
- ✅ 一键安装
- ✅ 简单快速
- ✅ 不需要 Git 知识

**使用步骤：**

```bash
# Windows PowerShell
Invoke-Expression (Invoke-WebRequest -Uri "https://codeup.aliyun.com/your-org/vibe-canva-templates/raw/main/scripts/install.ps1" -UseBasicParsing).Content

# Linux/Mac
curl -sSL https://codeup.aliyun.com/your-org/vibe-canva-templates/raw/main/scripts/install.sh | bash

# 或下载后执行
# 下载 install.ps1 或 install.sh
# 然后执行脚本
```

**自定义安装路径：**

```powershell
# PowerShell
.\install.ps1 -TargetPath "C:\Projects\my-app"

# Bash
./install.sh /path/to/my-app
```

---

#### 方式三：手动复制（灵活 ⭐⭐⭐）

**优点：**
- ✅ 完全控制
- ✅ 可选择性复制
- ✅ 可修改后使用

**使用步骤：**

```bash
# 1. 克隆模板仓库
git clone https://codeup.aliyun.com/your-org/vibe-canva-templates.git

# 2. 复制 .trae 目录
xcopy /E /I vibe-canva-templates my-new-project\.trae

# 3. 或使用 rsync（Linux/Mac）
rsync -av vibe-canva-templates/ my-new-project/.trae/

# 4. 创建项目配置
# 在 my-new-project/.trae/ 下创建 project-config.json
```

---

### 步骤 3：团队同步和更新

#### 3.1 创建更新脚本

**Windows 更新脚本 (`scripts/update.ps1`)：**

```powershell
# update.ps1
param(
    [switch]$Force
)

Write-Host "🔄 更新团队模板..." -ForegroundColor Green

# 检查 .trae 是否为 Git 子模块
$traePath = ".trae"
if (Test-Path "$traePath\.git") {
    Write-Host "`n📦 检测到 Git 子模块，使用 git submodule 更新..." -ForegroundColor Cyan
    
    # 更新子模块
    git submodule update --remote $traePath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 更新成功！" -ForegroundColor Green
        
        # 显示更新信息
        Set-Location $traePath
        $commit = git log -1 --format="%h - %s (%ar)"
        Write-Host "`n当前版本：$commit" -ForegroundColor Yellow
        Set-Location ..
    } else {
        Write-Host "❌ 更新失败" -ForegroundColor Red
    }
} else {
    Write-Host "`n⚠️  .trae 不是 Git 子模块" -ForegroundColor Yellow
    
    if ($Force) {
        Write-Host "📦 使用 git pull 更新..." -ForegroundColor Cyan
        Set-Location $traePath
        git pull origin main
        Set-Location ..
    } else {
        Write-Host "提示：使用 -Force 参数强制更新" -ForegroundColor Gray
        Write-Host "     或手动进入 .trae 目录执行 git pull" -ForegroundColor Gray
    }
}

# 检查是否需要重新生成配置
Write-Host "`n🔍 检查配置变更..." -ForegroundColor Cyan
if (Test-Path ".trae\config\default-config.json") {
    Write-Host "✓ 默认配置存在" -ForegroundColor Green
}
if (Test-Path ".trae\skills\registry.json") {
    Write-Host "✓ Skills 注册表存在" -ForegroundColor Green
}
if (Test-Path ".trae\templates\registry.json") {
    Write-Host "✓ Templates 注册表存在" -ForegroundColor Green
}

Write-Host "`n🎉 更新检查完成！" -ForegroundColor Green
```

**Linux/Mac 更新脚本 (`scripts/update.sh`)：**

```bash
#!/bin/bash

# update.sh
echo "🔄 更新团队模板..."

TRAE_PATH=".trae"

# 检查 .trae 是否为 Git 子模块
if [ -f "$TRAE_PATH/.git" ]; then
    echo -e "\n📦 检测到 Git 子模块，使用 git submodule 更新..."
    
    git submodule update --remote $TRAE_PATH
    
    if [ $? -eq 0 ]; then
        echo "✅ 更新成功！"
        
        # 显示更新信息
        cd $TRAE_PATH
        commit=$(git log -1 --format="%h - %s (%ar)")
        echo -e "\n当前版本：$commit"
        cd ..
    else
        echo "❌ 更新失败"
        exit 1
    fi
else
    echo -e "\n⚠️  .trae 不是 Git 子模块"
    
    if [ "$1" = "--force" ]; then
        echo "📦 使用 git pull 更新..."
        cd $TRAE_PATH
        git pull origin main
        cd ..
    else
        echo "提示：使用 --force 参数强制更新"
        echo "     或手动进入 .trae 目录执行 git pull"
    fi
fi

# 检查配置
echo -e "\n🔍 检查配置变更..."
[ -f ".trae/config/default-config.json" ] && echo "✓ 默认配置存在"
[ -f ".trae/skills/registry.json" ] && echo "✓ Skills 注册表存在"
[ -f ".trae/templates/registry.json" ] && echo "✓ Templates 注册表存在"

echo -e "\n🎉 更新检查完成！"
```

#### 3.2 团队更新流程

**定期同步（建议每周）：**

```bash
# 1. 运行更新脚本
.\.trae\scripts\update.ps1

# 或
./.trae/scripts/update.sh

# 2. 查看变更
cd .trae
git log --oneline --since="1 week ago"
cd ..

# 3. 测试新配置
# 在 Trae 中测试 Skills 和 Agents

# 4. 提交更新
git add .trae
git commit -m "chore: 同步团队模板配置"
```

**版本管理：**

```bash
# 查看当前模板版本
cd .trae
git describe --tags
git log -1

# 升级到特定版本
git submodule update --remote .trae
git checkout v1.2.0  # 切换到指定版本

# 或更新到最新
git submodule update --remote .trae
```

---

## 🎯 实际使用场景

### 场景一：创建新项目

**步骤：**

```bash
# 1. 创建新项目目录
mkdir my-shop
cd my-shop

# 2. 初始化 Git
git init

# 3. 添加团队模板
git submodule add https://codeup.aliyun.com/your-org/vibe-canva-templates.git .trae

# 4. 使用 Project Builder 创建项目
# 在 Trae 中输入：
# @project-builder 创建一个在线商城系统

# 5. 按照 6 步引导完成
# - 项目名称：my-shop
# - 项目描述：在线商城系统
# - 技术栈：Node.js + React
# - 数据库：MySQL
# - 部署：阿里云 ACK
# - ACR：默认配置

# 6. 提交初始配置
git add .
git commit -m "feat: 初始化项目（使用团队模板）"
```

---

### 场景二：团队成员加入项目

**新成员操作：**

```bash
# 1. 克隆项目（包含子模块）
git clone --recursive https://codeup.aliyun.com/your-org/my-shop.git

# 或
git clone https://codeup.aliyun.com/your-org/my-shop.git
cd my-shop
git submodule init
git submodule update

# 2. 验证 .trae 配置
ls -la .trae/

# 3. 开始开发
# Trae 会自动加载 .trae 中的 Agents 和 Skills
```

---

### 场景三：团队模板更新

**模板维护者：**

```bash
# 1. 在模板仓库中更新
cd vibe-canva-templates

# 2. 添加新 Skill 或更新配置
git add skills/new-skill/
git commit -m "feat: 添加新 Skill - New Skill Name"

# 3. 打版本标签
git tag v1.3.0
git push origin main --tags

# 4. 通知团队更新
# 在团队群组发布更新通知
```

**团队成员：**

```bash
# 1. 接收更新通知

# 2. 更新项目中的模板
cd my-project
.\.trae\scripts\update.ps1

# 或
git submodule update --remote .trae

# 3. 查看变更
cd .trae
git log --oneline -5
cd ..

# 4. 测试新配置
# 在 Trae 中测试新的 Skills

# 5. 提交更新
git add .trae
git commit -m "chore: 更新团队模板到 v1.3.0"
```

---

### 场景四：多项目统一管理

**团队有多个项目：**

```
project-a/
  └── .trae/ (子模块) → vibe-canva-templates

project-b/
  └── .trae/ (子模块) → vibe-canva-templates

project-c/
  └── .trae/ (子模块) → vibe-canva-templates
```

**统一更新所有项目：**

```bash
# 批量更新脚本 (update-all-projects.ps1)
$projects = Get-ChildItem -Path "C:\Projects" -Directory

foreach ($project in $projects) {
    $traePath = Join-Path $project.FullName ".trae"
    if (Test-Path $traePath) {
        Write-Host "🔄 更新 $($project.Name)..." -ForegroundColor Cyan
        Set-Location $traePath
        git pull origin main
        Set-Location ..
    }
}
```

---

## 📊 版本控制策略

### 语义化版本

```
主版本。次版本.修订版本
  ↑      ↑      ↑
  |      |      └─ 向后兼容的问题修正
  |      └─ 向后兼容的功能新增
  └─ 不兼容的 API 变更

示例：
v1.0.0  - 初始发布
v1.1.0  - 新增 Skill
v1.1.1  - 修复问题
v2.0.0  - 重大变更
```

### 分支策略

```
main          - 稳定版本（生产）
  ├── develop      - 开发分支
  │     ├── feature/new-skill  - 新功能
  │     └── bugfix/fix-issue   - 问题修复
  └── release/v1.2 - 发布分支
```

### 发布流程

```bash
# 1. 在 develop 分支开发
git checkout develop
git checkout -b feature/new-skill

# 2. 完成开发
git commit -m "feat: 添加新 Skill"

# 3. 合并到 develop
git checkout develop
git merge feature/new-skill

# 4. 测试

# 5. 创建发布分支
git checkout -b release/v1.2.0

# 6. 最终测试

# 7. 合并到 main
git checkout main
git merge release/v1.2.0

# 8. 打标签
git tag v1.2.0
git push origin main --tags
```

---

## 🔧 高级用法

### 1. 配置继承和覆盖

**项目特定配置：**

```json
// .trae-config.json
{
  "version": "1.0.0",
  "extends": ".trae",
  
  // 继承所有 Skills
  "skills": ["all"],
  
  // 但可以覆盖特定配置
  "overrides": {
    "code-template": {
      "defaultVariables": {
        "COMPANY_NAME": "我的公司",
        "TEAM_NAME": "我的团队"
      }
    }
  },
  
  // 项目特定模板
  "templates": {
    "source": ".trae/templates",
    "default": "nodejs-express-react"
  }
}
```

### 2. 条件加载

**根据项目类型加载不同配置：**

```json
// .trae/project-config.json
{
  "version": "1.0.0",
  "profiles": {
    "web": {
      "templates": ["nodejs-express-react", "java-springboot-vue"]
    },
    "ai": {
      "templates": ["autogen-multi-agent", "langgraph-workflow"]
    }
  }
}
```

### 3. 环境变量

**使用环境变量配置：**

```bash
# .env.trae
TRAE_TEMPLATE_REPO=https://codeup.aliyun.com/your-org/vibe-canva-templates.git
TRAE_TEMPLATE_VERSION=v1.2.0
TRAE_COMPANY_NAME=我的公司
```

---

## ✅ 检查清单

### 模板仓库设置

- [ ] 创建独立的 Git 仓库
- [ ] 优化目录结构
- [ ] 创建 README.md
- [ ] 创建安装脚本（Windows + Linux/Mac）
- [ ] 创建更新脚本
- [ ] 添加 LICENSE
- [ ] 添加 CHANGELOG.md
- [ ] 设置仓库权限

### 团队推广

- [ ] 编写使用文档
- [ ] 创建示例项目
- [ ] 团队培训
- [ ] 建立更新机制
- [ ] 收集反馈

### 持续维护

- [ ] 定期更新模板
- [ ] 版本管理
- [ ] 问题修复
- [ ] 功能新增
- [ ] 文档维护

---

## 📝 常见问题

### Q1: 如何回退到旧版本？

```bash
# 查看可用版本
cd .trae
git tag

# 切换到特定版本
git checkout v1.0.0

# 或使用 git submodule
cd ..
git submodule update --checkout .trae
```

### Q2: 多人同时更新冲突怎么办？

```bash
# 1. 先拉取最新
git pull origin main

# 2. 解决冲突
# 手动编辑冲突文件

# 3. 重新提交
git add .
git commit -m "fix: 解决配置冲突"
```

### Q3: 如何自定义模板？

```bash
# 1. 不要直接修改 .trae 目录
# 2. 在项目根目录创建 .trae-local/
mkdir .trae-local

# 3. 复制并修改需要的配置
cp .trae/skills/code-template .trae-local/

# 4. 在配置中引用
# .trae-config.json
{
  "localSkills": [".trae-local/code-template"]
}
```

---

## 🎉 总结

### 实施路线图

**第 1 天：** 创建模板仓库
- 提取 .trae 目录
- 创建基础文档
- 创建安装脚本

**第 2 天：** 团队测试
- 在 1-2 个项目中试点
- 收集反馈
- 优化脚本

**第 3 天：** 全面推广
- 团队培训
- 所有项目迁移
- 建立维护机制

### 关键成功因素

✅ **简单易用** - 一键安装，无需复杂配置  
✅ **易于更新** - Git 子模块自动同步  
✅ **版本可控** - 语义化版本管理  
✅ **团队参与** - 鼓励贡献和改进  
✅ **文档完善** - 详细的使用指南

---

**立即开始：**

```bash
# 1. 创建模板仓库
cd d:\Projects
git clone https://codeup.aliyun.com/your-org/vibe-canva-templates.git
xcopy /E /I vibe-canva\.trae vibe-canva-templates

# 2. 提交初始版本
cd vibe-canva-templates
git add .
git commit -m "feat: 初始版本"
git push origin main

# 3. 在新项目中使用
cd ..
mkdir my-new-project
cd my-new-project
git submodule add https://codeup.aliyun.com/your-org/vibe-canva-templates.git .trae
```

🎊 完成！现在你的团队有了统一的模板配置中心！
