# Vibe Canva 通用化使用指南

> **目标：** 将 Agents、Skills、Templates 变成可复用的通用工具
> 
> **适用场景：** 任何新项目、现有项目增强、团队协作

---

## 🎯 通用化策略

### 方案一：Trae Skills 系统（推荐 ⭐）

将 Skills 转换为 Trae 平台级 Skills，在所有项目中可用。

### 方案二：项目模板继承

将 Agents 和 Templates 集成到 Trae 配置中，通过模板继承使用。

### 方案三：独立工具包

将 Skills 封装为独立 CLI 工具或库，在任何项目中调用。

---

## 📋 详细实施方案

### 方案一：Trae Skills 系统（推荐 ⭐⭐⭐⭐⭐）

#### 1. Skills 通用化

**位置：** `d:\Projects\vibe-canva\.trae\skills\`

**转换为 Trae Skills 的步骤：**

```
1. 保持现有 SKILL.md 结构
2. 添加 Trae Skills 标准 frontmatter
3. 注册到 Trae 平台
4. 在所有项目中可用
```

**示例：Code Template Skill**

```markdown
---
name: code-template
description: 从模板复制代码并替换变量。用于快速创建项目结构、复制代码模式。
tools: ["Read", "Write", "Glob", "SearchReplace"]
---

# Code Template Skill

## 职责
从模板库复制代码文件并批量替换变量。

## 输入
- templatePath: 模板路径
- targetPath: 目标路径  
- variables: 变量替换对象

## 输出
- 完整的项目文件结构

## 工作流程
...（保持现有内容）
```

**如何在新项目中使用：**

在 Trae 中直接调用：
```
用户：帮我创建一个 Node.js 项目结构
Agent: 我将使用 code-template skill 从模板创建项目结构
```

#### 2. 注册到 Trae

创建 `.trae/skills/registry.json`：

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "id": "code-template",
      "name": "Code Template",
      "path": "./code-template/SKILL.md",
      "global": true
    },
    {
      "id": "config-generator",
      "name": "Config Generator", 
      "path": "./config-generator/SKILL.md",
      "global": true
    },
    {
      "id": "docker",
      "name": "Docker",
      "path": "./docker/SKILL.md",
      "global": true
    },
    {
      "id": "k8s-deploy",
      "name": "K8s Deploy",
      "path": "./k8s-deploy/SKILL.md",
      "global": true
    },
    {
      "id": "docs-generator",
      "name": "Docs Generator",
      "path": "./docs-generator/SKILL.md",
      "global": true
    }
  ]
}
```

---

### 方案二：项目模板继承

#### 1. 创建通用项目模板

**位置：** `d:\Projects\vibe-canva\.trae\templates\`

**在新项目中继承模板：**

步骤 1：在新项目中创建 `.trae/config.json`

```json
{
  "extends": "d:/Projects/vibe-canva/.trae",
  "agents": ["project-builder"],
  "skills": ["code-template", "config-generator", "docker", "k8s-deploy", "docs-generator"],
  "templates": {
    "source": "d:/Projects/vibe-canva/.trae/templates",
    "use": ["nodejs-express-react", "autogen-multi-agent"]
  }
}
```

步骤 2：在新项目中调用 Agent

```
用户：/project-builder 创建一个新项目
Agent: 检测到继承了 vibe-canva 模板，我将使用 project-builder agent...
```

#### 2. Agents 通用化

**创建全局 Agents 配置：**

在用户级别创建 `~/.trae/agents/vibe-canva-agents.json`：

```json
{
  "agents": [
    {
      "name": "project-builder",
      "source": "d:/Projects/vibe-canva/.trae/agents/project-builder-agent.md",
      "global": true
    },
    {
      "name": "acr-registry-setup",
      "source": "d:/Projects/vibe-canva/.trae/agents/acr-registry-setup-agent.md",
      "global": true
    }
  ]
}
```

**在任何项目中调用：**

```
用户：@project-builder 帮我创建一个项目
```

---

### 方案三：独立工具包

#### 1. 创建 CLI 工具

**位置：** `d:\Projects\vibe-canva\tools\`

**创建 `vibe-canva-cli` 工具：**

```javascript
#!/usr/bin/env node

// vibe-canva-cli.js
const fs = require('fs');
const path = require('path');

class VibeCanvaCLI {
  // 使用模板创建项目
  static createProject(templateName, projectName) {
    const templatePath = path.join(__dirname, '../.trae/templates', templateName);
    const targetPath = path.join(process.cwd(), projectName);
    
    // 复制模板
    this.copyTemplate(templatePath, targetPath);
    
    // 替换变量
    this.replaceVariables(targetPath, {
      '{{PROJECT_NAME}}': projectName
    });
    
    console.log(`✅ 项目创建成功：${targetPath}`);
  }
  
  // 生成 Docker 配置
  static generateDocker(config) {
    // 调用 Docker Skill 逻辑
  }
  
  // 生成 K8s 配置
  static generateK8s(config) {
    // 调用 K8s Deploy Skill 逻辑
  }
}

// CLI 命令
const command = process.argv[2];
if (command === 'create') {
  VibeCanvaCLI.createProject(process.argv[3], process.argv[4]);
}
```

**使用方式：**

```bash
# 安装
npm install -g vibe-canva-cli

# 创建项目
vibe create nodejs-express-react my-app

# 生成 Docker 配置
vibe docker generate

# 生成 K8s 配置
vibe k8s generate
```

#### 2. 创建 npm 包

**创建 `@vibe-canva/skills` 包：**

```javascript
// packages/skills/src/index.js
export { codeTemplate } from './code-template.js';
export { configGenerator } from './config-generator.js';
export { docker } from './docker.js';
export { k8sDeploy } from './k8s-deploy.js';
export { docsGenerator } from './docs-generator.js';
```

**在项目中使用：**

```javascript
// 在新项目中
import { codeTemplate, docker } from '@vibe-canva/skills';

// 使用模板创建项目
await codeTemplate({
  template: 'nodejs-express-react',
  target: './my-project',
  variables: {
    PROJECT_NAME: 'my-app'
  }
});

// 生成 Docker 配置
await docker.generate({
  projectType: 'nodejs',
  port: 8080
});
```

---

## 🚀 推荐方案：混合模式

结合三种方案的优点：

### 架构设计

```
┌─────────────────────────────────────────────┐
│         Trae 平台级 Skills                   │
│  （所有项目自动可用）                         │
│  - code-template                            │
│  - config-generator                         │
│  - docker                                   │
│  - k8s-deploy                               │
│  - docs-generator                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        项目级 Agents 配置                     │
│  （通过 .trae/config.json 继承）              │
│  - project-builder                          │
│  - acr-registry-setup                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         模板库（全局或本地）                   │
│  - Web 全栈模板（4 个）                        │
│  - AI Agent 模板（4 个）                      │
└─────────────────────────────────────────────┘
```

### 实施步骤

#### 步骤 1：Skills 通用化（最高优先级）

**操作：**
1. 为每个 Skill 添加 Trae Skills 标准 frontmatter
2. 创建 `.trae/skills/registry.json`
3. 测试在每个项目中可用

**时间：** 约 1 小时

#### 步骤 2：Agents 配置化

**操作：**
1. 创建 `.trae/config.json` 配置文件
2. 定义 Agents 的引用路径
3. 支持全局和局部两种模式

**时间：** 约 30 分钟

#### 步骤 3：Templates 可移植化

**操作：**
1. 确保模板使用相对路径
2. 支持从任意路径加载模板
3. 创建模板选择器 UI（可选）

**时间：** 约 1 小时

---

## 📁 文件结构建议

### 全局配置（用户级别）

```
~/.trae/
├── agents/
│   ├── project-builder.md（符号链接到 vibe-canva）
│   └── acr-registry-setup.md
├── skills/
│   ├── registry.json（注册所有 Skills）
│   └── ...（符号链接到 vibe-canva 的 skills）
└── config.json
    {
      "skillsPath": ["d:/Projects/vibe-canva/.trae/skills"],
      "templatesPath": ["d:/Projects/vibe-canva/.trae/templates"],
      "defaultAgent": "project-builder"
    }
```

### 项目配置（项目级别）

```
my-new-project/
├── .trae/
│   ├── config.json（继承全局配置）
│   └── ...（项目特定配置）
├── src/
├── package.json
└── ...
```

---

## 💡 最佳实践

### 1. Skills 设计原则

✅ **单一职责** - 每个 Skill 只做一件事
✅ **无状态** - 不依赖项目特定状态
✅ **可组合** - 可以组合多个 Skills
✅ **文档完整** - 包含使用示例

### 2. Agents 设计原则

✅ **声明式配置** - 使用 frontmatter 定义触发条件
✅ **协调而非执行** - 负责调度 Skills，不直接操作文件
✅ **用户友好** - 引导式交互，减少用户输入

### 3. Templates 设计原则

✅ **变量化** - 所有项目特定信息都用变量
✅ **模块化** - 可以组合不同模板的部分
✅ **版本化** - 使用语义化版本管理模板

---

## 🔧 快速开始

### 在新项目中使用

**方式 1：使用 Project Builder Agent（最简单）**

```
1. 在新项目中打开 Trae
2. 输入：@project-builder 创建一个 Node.js 项目
3. 按照 6 步引导完成
4. ✅ 项目创建完成
```

**方式 2：手动继承配置**

```bash
# 1. 创建新项目
mkdir my-app && cd my-app

# 2. 复制 .trae 配置
xcopy /E /I d:\Projects\vibe-canva\.trae .trae

# 3. 修改 .trae/config.json
{
  "extends": "d:/Projects/vibe-canva/.trae"
}

# 4. 开始使用
# 在 Trae 中直接调用 Skills 和 Agents
```

**方式 3：使用 CLI 工具（开发中）**

```bash
# 安装
npm install -g vibe-canva-cli

# 创建项目
vibe create nodejs-express-react my-app
cd my-app

# 使用 Skills
vibe skill use code-template
```

---

## 📊 对比分析

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Trae Skills** | 平台级支持、所有项目自动可用 | 需要 Trae 平台支持 | ⭐⭐⭐⭐⭐ |
| **模板继承** | 简单易用、配置灵活 | 需要手动配置继承 | ⭐⭐⭐⭐ |
| **CLI 工具** | 独立运行、不依赖 IDE | 开发成本高 | ⭐⭐⭐ |
| **npm 包** | 可编程、集成灵活 | 维护成本高 | ⭐⭐⭐ |

---

## 🎯 立即行动方案

### 第一步：Skills 通用化（今天完成）

1. ✅ 为 5 个 Skills 添加标准 frontmatter
2. ✅ 创建 `.trae/skills/registry.json`
3. ✅ 测试在新项目中可用
4. ✅ 编写使用文档

### 第二步：Agents 配置化（明天完成）

1. 创建 `.trae/config.json` 模板
2. 配置 Agents 的全局路径
3. 测试 Agents 在新项目中可用

### 第三步：Templates 可移植化（后天完成）

1. 检查所有模板的路径
2. 支持相对路径和绝对路径
3. 创建模板选择器

### 第四步：文档和示例（周末完成）

1. 编写通用化使用指南
2. 创建示例项目
3. 录制使用视频

---

## 📝 检查清单

### Skills 通用化检查

- [ ] 所有 Skills 都有标准 frontmatter
- [ ] 创建 skills registry.json
- [ ] 测试在新项目中可调用
- [ ] 文档完整

### Agents 通用化检查

- [ ] 创建 config.json 模板
- [ ] 配置全局路径
- [ ] 测试 Agents 继承
- [ ] 文档完整

### Templates 通用化检查

- [ ] 所有模板使用变量化
- [ ] 支持相对路径
- [ ] 测试模板复制
- [ ] 文档完整

---

## 🔗 相关资源

- [Trae Skills 开发指南](https://trae.ai/docs/skills)
- [Agent Development 标准](d:\Projects\vibe-canva\.trae\skills\code-template\SKILL.md)
- [模板开发最佳实践](d:\Projects\vibe-canva\.trae\templates\README.md)

---

**下一步：** 选择方案一开始实施，为 5 个 Skills 添加 Trae Skills 标准 frontmatter。
