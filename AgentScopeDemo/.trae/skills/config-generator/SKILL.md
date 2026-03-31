---
name: config-generator
description: 根据项目信息和技术栈自动生成 DevOps 配置文件。当需要生成云效流水线、K8s 配置、环境配置文件时使用。
---

# Config Generator Skill

## 何时使用此 Skill

使用此 Skill 当：
- 创建新项目后需要 DevOps 配置
- 需要生成云效流水线 YAML（flow-yunxiao.yml）
- 需要生成 K8s 部署配置
- 需要生成环境配置文件（.env.example）
- Project Builder Agent 调用时

## 核心工作流程

### 1. 准备配置模板

```
1. 读取配置模板（.trae/templates/configs/）
2. 验证模板完整性
3. 加载变量映射表
```

### 2. 生成云效流水线配置

**生成文件：** `.trae/flow-yunxiao.yml`

**配置内容：**
- 构建阶段（Docker 镜像构建）
- 推送阶段（推送到 ACR）
- 部署阶段（K8s 部署）

详见：[云效流水线配置](./references/flow-config.md)

### 3. 生成 K8s 配置

**生成文件：**
- `.trae/namespace.yaml` - K8s 命名空间
- `.trae/server-deployment.yaml` - 后端 Deployment
- `.trae/web-deployment.yaml` - 前端 Deployment

详见：[K8s 配置](./references/k8s-config.md)

### 4. 生成环境配置文件

**生成文件：**
- `apps/server/.env.example` - 后端环境配置
- `apps/web/.env.example` - 前端环境配置

详见：[环境配置](./references/env-config.md)

### 5. 生成 Docker Compose（可选）

**条件：** 部署类型为 LOCAL 时

**生成文件：** `docker-compose.yml`

详见：[Docker Compose](./references/docker-compose.md)

## 输入/输出规范

### 输入参数

```json
{
  "action": "generate_configs",
  "project_info": {
    "name": "my-shop",
    "description": "在线商城系统",
    "tech_stack": "nodejs-express-react"
  },
  "deployment": {
    "type": "ACK",
    "acr_registry": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com",
    "acr_namespace": "vibe-canva",
    "k8s_namespace": "my-shop-prod"
  },
  "target_dir": "/path/to/project"
}
```

### 输出结果

**成功：**
```json
{
  "success": true,
  "configs_generated": 6,
  "files": [
    ".trae/flow-yunxiao.yml",
    ".trae/namespace.yaml",
    ".trae/server-deployment.yaml",
    ".trae/web-deployment.yaml",
    "apps/server/.env.example",
    "apps/web/.env.example"
  ]
}
```

**失败：**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DEPLOYMENT_TYPE",
    "message": "不支持的部署类型"
  }
}
```

## 配置生成逻辑

### 根据部署类型生成不同配置

**ACK（阿里云 Kubernetes）：**
- 包含 K8s 部署阶段
- 使用 k8s_deploy 插件
- 配置镜像密钥

**ECS（阿里云云服务器）：**
- 包含 SSH 部署阶段
- 使用 ssh_deploy 插件
- 配置服务器信息

**LOCAL（本地开发）：**
- 仅包含构建阶段
- 生成 docker-compose.yml
- 不包含部署阶段

## 错误处理

**常见错误码：**
- `INVALID_DEPLOYMENT_TYPE` - 部署类型无效
- `MISSING_REQUIRED_PARAM` - 缺少必填参数
- `TEMPLATE_NOT_FOUND` - 配置模板不存在
- `WRITE_FAILED` - 文件写入失败
- `VALIDATION_FAILED` - 配置验证失败

详见：[错误处理](./references/error-handling.md)

## 配置验证

**验证清单：**
- [ ] YAML 格式正确
- [ ] 必填字段完整
- [ ] 镜像地址正确
- [ ] 命名空间一致
- [ ] 环境变量完整

详见：[验证规则](./references/validation.md)

## 使用示例

**示例 1：生成 ACK 部署配置**

```
输入：
- project_info.name: my-shop
- deployment.type: ACK
- deployment.k8s_namespace: my-shop-prod

生成：
- flow-yunxiao.yml（包含 K8s 部署阶段）
- namespace.yaml（my-shop-prod 命名空间）
- server-deployment.yaml（2 个副本）
- web-deployment.yaml（2 个副本）
```

**示例 2：生成本地开发配置**

```
输入：
- deployment.type: LOCAL

生成：
- flow-yunxiao.yml（仅构建和推送阶段）
- docker-compose.yml（本地运行）
- .env.example（开发环境配置）
```

## 相关资源

- [云效流水线配置](./references/flow-config.md) - 详细流水线配置
- [K8s 配置](./references/k8s-config.md) - Kubernetes 部署配置
- [环境配置](./references/env-config.md) - 环境变量配置
- [Docker Compose](./references/docker-compose.md) - 本地开发配置
- [错误处理](./references/error-handling.md) - 错误码和处理
- [验证规则](./references/validation.md) - 配置验证规则
