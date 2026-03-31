---
name: code-template
description: 基于模板文件复制和变量替换快速生成项目代码结构。当需要创建新项目、复制模板文件、批量替换项目变量时使用。
---

# Code Template Skill

## 何时使用此 Skill

使用此 Skill 当：
- 创建新项目时
- 需要复制模板文件到目标目录
- 需要批量替换项目变量（项目名、配置等）
- Project Builder Agent 调用时

## 核心工作流程

### 1. 读取模板

```
1. 读取 `.trae/templates/registry.json` 获取模板列表
2. 根据 template_id 查找对应模板
3. 读取模板元数据（metadata.json）
4. 读取变量定义（variables.json）
5. 验证模板完整性
```

### 2. 复制文件

```
1. 创建目标目录
2. 复制 `templates/{template_id}/files/` 下所有文件
3. 保持目录结构
4. 处理文件名中的变量（如 {{PROJECT_NAME}}.yaml）
```

### 3. 替换变量

**变量格式：** `{{VARIABLE_NAME}}`

**变量类型：**
- 项目变量：`{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, `{{PROJECT_VERSION}}`
- 配置变量：`{{ACR_REGISTRY}}`, `{{ACR_NAMESPACE}}`, `{{K8S_NAMESPACE}}`
- 系统变量：`{{TIMESTAMP}}`, `{{GENERATED_DATE}}`

**替换规则：**
1. 全局替换 - 在所有文本文件中替换
2. 文件名替换 - 替换文件名中的变量
3. 转义处理 - YAML 特殊字符需要转义

详见：[变量替换规则](./references/variable-rules.md)

### 4. 验证结果

```
1. 验证文件数量 > 0
2. 验证关键文件存在（package.json, README.md 等）
3. 验证无未替换的变量（检查 {{...}} 模式）
4. 返回执行结果
```

## 输入/输出规范

### 输入参数

```json
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

### 输出结果

**成功：**
```json
{
  "success": true,
  "files_copied": 45,
  "files_modified": 12,
  "target_directory": "/path/to/my-shop"
}
```

**失败：**
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "模板不存在"
  }
}
```

## 错误处理

**常见错误码：**
- `TEMPLATE_NOT_FOUND` - 模板不存在
- `INVALID_INPUT` - 输入参数无效
- `COPY_FAILED` - 文件复制失败
- `REPLACE_FAILED` - 变量替换失败
- `VALIDATION_FAILED` - 文件验证失败

详见：[错误处理](./references/error-handling.md)

## 模板文件结构

```
.trae/templates/
├── registry.json
└── nodejs-express-react/
    ├── metadata.json
    ├── variables.json
    └── files/
        ├── apps/server/
        ├── apps/web/
        ├── package.json
        └── Dockerfile
```

详见：[模板结构](./references/template-structure.md)

## 使用示例

**示例 1：创建 Node.js 项目**

```
用户：创建一个在线商城项目，使用 Node.js + React

Skill 执行:
1. 选择 nodejs-express-react 模板
2. 复制模板文件到 my-shop 目录
3. 替换 {{PROJECT_NAME}} 为 my-shop
4. 替换所有配置变量
5. 验证结果
```

**示例 2：批量替换变量**

```
输入：
- {{PROJECT_NAME}} = my-shop
- {{ACR_REGISTRY}} = crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com

执行:
- package.json: "name": "{{PROJECT_NAME}}" → "name": "my-shop"
- Dockerfile: FROM {{ACR_REGISTRY}}/... → FROM crpi-xxx...
```

## 相关资源

- [变量替换规则](./references/variable-rules.md) - 详细变量格式和替换规则
- [错误处理](./references/error-handling.md) - 完整错误码和处理方法
- [模板结构](./references/template-structure.md) - 模板文件结构说明
- [输入输出规范](./references/io-spec.md) - 详细 API 规范
