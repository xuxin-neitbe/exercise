# 输入/输出规范

## 输入参数

### 基本结构

```json
{
  "action": "create_project",
  "template_id": "nodejs-express-react",
  "project_info": {
    "name": "my-shop",
    "description": "在线商城系统",
    "version": "1.0.0",
    "author": "开发者姓名"
  },
  "config": {
    "acr_registry": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com",
    "acr_namespace": "vibe-canva",
    "namespace": "my-shop-prod"
  },
  "target_dir": "/path/to/project"
}
```

### 参数详解

#### action (必填)

**类型：** string  
**说明：** 操作类型  
**可选值：**
- `create_project` - 创建新项目

**示例：**
```json
{
  "action": "create_project"
}
```

#### template_id (必填)

**类型：** string  
**说明：** 模板 ID，必须在 registry.json 中注册  
**示例：**
```json
{
  "template_id": "nodejs-express-react"
}
```

**可用模板：**
- `nodejs-express-react` - Node.js + React
- `java-springboot-vue` - Java + Vue
- `python-fastapi-react` - Python + React
- `go-gin-vue` - Go + Vue

#### project_info (必填)

**类型：** object  
**说明：** 项目基本信息

**字段：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | ✅ | - | 项目名称 |
| description | string | ✅ | - | 项目描述 |
| version | string | ❌ | "1.0.0" | 版本号 |
| author | string | ❌ | "" | 作者姓名 |

**示例：**
```json
{
  "project_info": {
    "name": "my-shop",
    "description": "在线商城系统",
    "version": "1.0.0",
    "author": "张三"
  }
}
```

#### config (必填)

**类型：** object  
**说明：** 配置信息

**字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| acr_registry | string | ✅ | ACR 镜像仓库地址 |
| acr_namespace | string | ✅ | ACR 命名空间 |
| namespace | string | ✅ | K8s 命名空间 |
| deployment_type | string | ❌ | 部署类型（ACK/ECS/LOCAL） |

**示例：**
```json
{
  "config": {
    "acr_registry": "crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com",
    "acr_namespace": "vibe-canva",
    "namespace": "my-shop-prod",
    "deployment_type": "ACK"
  }
}
```

#### target_dir (必填)

**类型：** string  
**说明：** 目标目录路径（绝对路径）  
**示例：**
```json
{
  "target_dir": "/Users/username/projects/my-shop"
}
```

## 输出结果

### 成功响应

**格式：**

```json
{
  "success": true,
  "message": "项目创建成功",
  "data": {
    "project_name": "my-shop",
    "template_used": "nodejs-express-react",
    "files_copied": 45,
    "files_modified": 12,
    "target_directory": "/path/to/my-shop",
    "file_list": [
      "apps/server/src/index.ts",
      "apps/web/src/App.tsx",
      "package.json",
      "Dockerfile"
    ],
    "variables_replaced": {
      "{{PROJECT_NAME}}": "my-shop",
      "{{PROJECT_DESCRIPTION}}": "在线商城系统",
      "{{ACR_REGISTRY}}": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com"
    }
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 执行结果（true） |
| message | string | 成功消息 |
| data.project_name | string | 项目名称 |
| data.template_used | string | 使用的模板 ID |
| data.files_copied | number | 复制的文件数 |
| data.files_modified | number | 修改的文件数 |
| data.target_directory | string | 目标目录路径 |
| data.file_list | string[] | 文件列表 |
| data.variables_replaced | object | 变量替换映射 |

### 失败响应

**格式：**

```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "模板 'nodejs-express-react' 不存在",
    "details": {
      "template_id": "nodejs-express-react",
      "available_templates": ["nodejs-express-react", "java-springboot-vue"]
    }
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 执行结果（false） |
| error.code | string | 错误码 |
| error.message | string | 错误消息 |
| error.details | object | 错误详情 |

## 错误码完整列表

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| TEMPLATE_NOT_FOUND | 404 | 模板不存在 |
| INVALID_INPUT | 400 | 输入参数无效 |
| COPY_FAILED | 500 | 文件复制失败 |
| REPLACE_FAILED | 500 | 变量替换失败 |
| VALIDATION_FAILED | 500 | 文件验证失败 |

## 使用示例

### 示例 1：创建 Node.js 项目

**输入：**

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
  "target_dir": "/Users/username/projects/my-shop"
}
```

**输出：**

```json
{
  "success": true,
  "data": {
    "project_name": "my-shop",
    "template_used": "nodejs-express-react",
    "files_copied": 45,
    "files_modified": 12
  }
}
```

### 示例 2：错误处理

**输入：**

```json
{
  "action": "create_project",
  "template_id": "invalid-template"
}
```

**输出：**

```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "模板 'invalid-template' 不存在",
    "details": {
      "template_id": "invalid-template",
      "available_templates": ["nodejs-express-react", "java-springboot-vue"]
    }
  }
}
```

## 最佳实践

### 1. 验证输入

```javascript
function validateInput(input) {
  const required = ['action', 'template_id', 'project_info', 'target_dir'];
  for (const field of required) {
    if (!input[field]) {
      throw new Error(`缺少必填参数：${field}`);
    }
  }
}
```

### 2. 提供详细错误信息

```javascript
try {
  await createProject(input);
} catch (error) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: {
        ...error.details,
        timestamp: new Date().toISOString()
      }
    }
  };
}
```

### 3. 记录执行日志

```javascript
const log = {
  startTime: Date.now(),
  action: input.action,
  template: input.template_id,
  target: input.target_dir,
  result: result.success,
  duration: Date.now() - startTime
};
```
