# Node.js + Express + React 模板

## 模板说明

这是一个全栈 JavaScript 项目模板，包含：
- 后端：Node.js + Express + TypeScript
- 前端：React + Vite + TypeScript
- 数据库：PostgreSQL
- 部署：Docker + Kubernetes

## 模板结构

```
files/
├── apps/
│   ├── server/              # 后端应用
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # 前端应用
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── .env.example
│       ├── Dockerfile
│       ├── index.html
│       ├── nginx.conf
│       ├── package.json
│       └── vite.config.ts
├── infra/
│   ├── k8s/                 # Kubernetes 配置
│   │   ├── namespace.yaml
│   │   ├── server-deployment.yaml
│   │   └── web-deployment.yaml
│   └── docker-compose.yml   # Docker Compose 配置
├── .trae/                   # Trae 配置
│   └── flow-yunxiao.yml    # 云效流水线
├── docs/                    # 文档
│   └── README.md
├── scripts/                 # 脚本
├── .dockerignore
├── .gitignore
├── package.json            # 根 package.json
└── README.md
```

## 变量替换

本模板使用以下变量：

### 项目变量
- `{{PROJECT_NAME}}` - 项目名称
- `{{PROJECT_DESCRIPTION}}` - 项目描述
- `{{PROJECT_VERSION}}` - 版本号
- `{{PROJECT_AUTHOR}}` - 作者

### 配置变量
- `{{ACR_REGISTRY}}` - ACR 镜像仓库地址
- `{{ACR_NAMESPACE}}` - ACR 命名空间
- `{{K8S_NAMESPACE}}` - K8s 命名空间
- `{{DEPLOYMENT_TYPE}}` - 部署类型

### 系统变量
- `{{TIMESTAMP}}` - 时间戳
- `{{GENERATED_DATE}}` - 生成日期

## 使用示例

```bash
# 使用 code-template-skill 创建项目
{
  "action": "create_project",
  "template_id": "nodejs-express-react",
  "project_info": {
    "name": "my-shop",
    "description": "在线商城系统",
    "version": "1.0.0"
  },
  "config": {
    "acr_registry": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com",
    "acr_namespace": "vibe-canva",
    "namespace": "my-shop-prod"
  },
  "target_dir": "/path/to/project"
}
```

## 下一步

1. 复制当前项目的文件到 `files/` 目录
2. 在文件中使用变量替换硬编码的值
3. 测试模板创建功能
4. 更新 metadata.json 中的文件数量

## 开发指南

详见：
- [Code Template Skill](../../skills/code-template/SKILL.md)
- [变量替换规则](../../skills/code-template/references/variable-rules.md)
- [模板结构](../../skills/code-template/references/template-structure.md)
