# 错误处理

## 错误码列表

### INVALID_DEPLOYMENT_TYPE

**说明：** 部署类型无效

**原因：**
- deployment.type 值不在允许范围内
- 拼写错误

**解决方案：**
检查 deployment.type 的值，必须是以下之一：
- `ACK` - 阿里云 Kubernetes
- `ECS` - 阿里云云服务器
- `LOCAL` - 本地开发

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DEPLOYMENT_TYPE",
    "message": "不支持的部署类型：INVALID",
    "details": {
      "provided_type": "INVALID",
      "valid_types": ["ACK", "ECS", "LOCAL"]
    }
  }
}
```

### MISSING_REQUIRED_PARAM

**说明：** 缺少必填参数

**原因：**
- 输入参数不完整
- 参数名为空

**解决方案：**
检查以下必填参数：
- action
- project_info.name
- deployment.type
- deployment.acr_registry
- target_dir

```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_PARAM",
    "message": "缺少必填参数：acr_registry",
    "details": {
      "missing_fields": ["acr_registry"]
    }
  }
}
```

### TEMPLATE_NOT_FOUND

**说明：** 配置模板不存在

**原因：**
- 模板文件未创建
- 模板路径错误

**解决方案：**
1. 检查 `.trae/templates/configs/` 目录
2. 验证模板文件存在
3. 检查文件权限

```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "配置模板不存在：flow-yunxiao.yml",
    "details": {
      "template": "flow-yunxiao.yml",
      "expected_path": ".trae/templates/configs/flow-yunxiao.yml"
    }
  }
}
```

### WRITE_FAILED

**说明：** 文件写入失败

**原因：**
- 目录权限不足
- 磁盘空间不足
- 文件被占用

**解决方案：**
1. 检查目标目录权限
2. 验证磁盘空间
3. 关闭占用文件的程序

```json
{
  "success": false,
  "error": {
    "code": "WRITE_FAILED",
    "message": "文件写入失败：.trae/flow-yunxiao.yml",
    "details": {
      "file": ".trae/flow-yunxiao.yml",
      "reason": "Permission denied"
    }
  }
}
```

### VALIDATION_FAILED

**说明：** 配置验证失败

**原因：**
- YAML 格式错误
- 必填字段缺失
- 配置值不合法

**解决方案：**
1. 使用 YAML 验证工具检查格式
2. 检查必填字段
3. 验证配置值

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "YAML 格式错误：.trae/namespace.yaml",
    "details": {
      "file": ".trae/namespace.yaml",
      "line": 5,
      "column": 3,
      "error": "expected key, found end of file"
    }
  }
}
```

## 错误处理最佳实践

### 1. 尽早验证

```javascript
function validateInput(input) {
  const errors = [];
  
  // 验证必填参数
  if (!input.action) errors.push('缺少 action');
  if (!input.project_info?.name) errors.push('缺少项目名称');
  if (!input.deployment?.type) errors.push('缺少部署类型');
  
  // 验证部署类型
  const validTypes = ['ACK', 'ECS', 'LOCAL'];
  if (input.deployment?.type && !validTypes.includes(input.deployment.type)) {
    errors.push(`部署类型必须是 ${validTypes.join(', ')}`);
  }
  
  if (errors.length > 0) {
    throw new Error(`输入验证失败：${errors.join(', ')}`);
  }
}
```

### 2. 提供有用的错误信息

```javascript
// 不好的错误信息
throw new Error('配置失败');

// 好的错误信息
throw new Error(`K8s 配置生成失败：namespace.yaml 缺少必填字段 'metadata.name'`);
```

### 3. 记录错误上下文

```javascript
const errorContext = {
  code: 'VALIDATION_FAILED',
  file: '.trae/namespace.yaml',
  operation: 'generate_k8s_config',
  timestamp: new Date().toISOString(),
  input: {
    project_name: input.project_info.name,
    deployment_type: input.deployment.type
  }
};
```

### 4. 友好的用户提示

```javascript
function getUserFriendlyMessage(error) {
  switch (error.code) {
    case 'INVALID_DEPLOYMENT_TYPE':
      return `部署类型 "${error.details.provided_type}" 不支持。\n请选择：ACK（Kubernetes）、ECS（云服务器）或 LOCAL（本地开发）`;
    
    case 'MISSING_REQUIRED_PARAM':
      return `配置不完整，缺少：${error.details.missing_fields.join(', ')}`;
    
    case 'TEMPLATE_NOT_FOUND':
      return `模板文件不存在，请先创建：${error.details.template}`;
    
    default:
      return `配置生成失败：${error.message}`;
  }
}
```

## 恢复策略

### 策略 1：回滚

```javascript
const createdFiles = [];

try {
  await generateFlowConfig();
  createdFiles.push('.trae/flow-yunxiao.yml');
  
  await generateK8sConfig();
  createdFiles.push('.trae/namespace.yaml');
  
} catch (error) {
  // 回滚：删除已创建的文件
  for (const file of createdFiles) {
    try {
      await fs.unlink(file);
    } catch (e) {
      console.error(`删除文件失败：${file}`, e);
    }
  }
  throw error;
}
```

### 策略 2：部分成功

```javascript
const result = {
  success: false,
  partialSuccess: true,
  files: {
    success: ['.trae/flow-yunxiao.yml'],
    failed: ['.trae/namespace.yaml']
  },
  errors: [
    {
      file: '.trae/namespace.yaml',
      error: 'YAML 格式错误'
    }
  ]
};
```

### 策略 3：重试机制

```javascript
async function writeWithRetry(file, content, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fs.writeFile(file, content);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 等待一段时间后重试
      await sleep(1000 * (i + 1));
    }
  }
}
```

## 调试技巧

### 1. 启用详细日志

```javascript
const DEBUG = process.env.DEBUG === 'config-generator';

function log(message, ...args) {
  if (DEBUG) {
    console.log(`[ConfigGenerator] ${message}`, ...args);
  }
}

log('开始生成配置', { project: input.project_info.name });
```

### 2. 验证 YAML 格式

```javascript
const yaml = require('js-yaml');

try {
  yaml.load(generatedYaml);
  console.log('YAML 格式正确');
} catch (error) {
  console.error('YAML 格式错误:', error.message);
  console.error('错误位置:', `第${error.mark.line}行，第${error.mark.column}列`);
}
```

### 3. 检查文件内容

```javascript
// 生成后检查文件
const content = await fs.readFile('.trae/namespace.yaml', 'utf-8');
console.log('文件内容:', content);

// 检查是否包含未替换的变量
const unreplacedPattern = /\{\{[^}]+\}\}/g;
const matches = content.match(unreplacedPattern);
if (matches) {
  console.warn('发现未替换的变量:', matches);
}
```
