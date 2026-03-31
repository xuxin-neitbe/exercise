---
name: docs-generator
description: 生成项目文档。当需要创建 README.md、部署文档、API 文档、使用指南时使用。
---

# Docs Generator Skill

## 何时使用此 Skill

使用此 Skill 当：
- 创建新项目需要文档
- 需要生成 README.md
- 需要生成部署文档
- 需要生成 API 文档
- 需要生成使用指南

## 核心工作流程

### 1. 生成 README.md

**内容包含：**
- 项目介绍
- 技术栈
- 快速开始
- 目录结构
- 开发指南
- 部署指南
- 贡献指南

详见：[README 模板](./references/readme-template.md)

### 2. 生成部署文档

**内容包含：**
- 环境要求
- 本地开发部署
- 生产环境部署
- CI/CD 配置
- 故障排查

详见：[部署文档](./references/deployment-docs.md)

### 3. 生成 API 文档

**内容包含：**
- API 概览
- 认证方式
- 端点列表
- 请求/响应示例
- 错误码

详见：[API 文档](./references/api-docs.md)

### 4. 生成使用指南

**内容包含：**
- 快速开始
- 配置说明
- 常见问题
- 最佳实践

详见：[使用指南](./references/user-guide.md)

## 输入/输出规范

### 输入参数

```json
{
  "action": "generate_docs",
  "project_info": {
    "name": "my-shop",
    "description": "在线商城系统",
    "tech_stack": "nodejs-express-react"
  },
  "docs_config": {
    "include_deployment": true,
    "include_api_docs": true,
    "language": "zh-CN"
  },
  "target_dir": "/path/to/project"
}
```

### 输出结果

**成功：**
```json
{
  "success": true,
  "docs_generated": 4,
  "files": [
    "README.md",
    "docs/DEPLOYMENT.md",
    "docs/API.md",
    "docs/GUIDE.md"
  ]
}
```

## 文档模板

### README.md 结构

```markdown
# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 技术栈

- 后端：Node.js + Express
- 前端：React
- 数据库：PostgreSQL

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+

### 安装

\`\`\`bash
git clone <repo>
npm install
\`\`\`

### 运行

\`\`\`bash
npm run dev
\`\`\`

## 目录结构

\`\`\`
apps/
├── server/    # 后端
└── web/       # 前端
\`\`\`

## 部署

详见 [部署文档](docs/DEPLOYMENT.md)

## 许可证

MIT
```

## 最佳实践

### 1. 文档即代码

- 文档跟随代码版本
- 使用 Markdown 格式
- 存放在代码仓库

### 2. 保持更新

- 及时更新文档
- 版本对应
- 标注最后更新时间

### 3. 清晰简洁

- 使用简单语言
- 提供示例
- 包含截图

## 使用示例

**示例 1：生成完整文档**

```
输入：
- project_info.name: my-shop
- project_info.description: 在线商城系统

生成：
- README.md
- docs/DEPLOYMENT.md
- docs/API.md
- docs/GUIDE.md
```

## 相关资源

- [README 模板](./references/readme-template.md)
- [部署文档](./references/deployment-docs.md)
- [API 文档](./references/api-docs.md)
- [使用指南](./references/user-guide.md)
