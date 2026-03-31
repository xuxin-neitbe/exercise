# 错误处理

## 错误码定义

### TEMPLATE_NOT_FOUND

**说明：** 模板不存在

**原因：**
- template_id 拼写错误
- 模板目录未创建
- registry.json 配置错误

**解决方案：**
1. 检查 template_id 是否正确
2. 验证 `.trae/templates/{template_id}/` 目录存在
3. 检查 registry.json 中的模板配置

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

### INVALID_INPUT

**说明：** 输入参数无效

**原因：**
- 缺少必填参数
- 参数类型错误
- 参数值格式不正确

**解决方案：**
1. 检查必填参数：action, template_id, project_info, target_dir
2. 验证参数类型正确
3. 检查参数值格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "缺少必填参数：template_id",
    "details": {
      "missing_fields": ["template_id"]
    }
  }
}
```

### COPY_FAILED

**说明：** 文件复制失败

**原因：**
- 目标目录权限不足
- 磁盘空间不足
- 源文件不存在

**解决方案：**
1. 检查目标目录权限
2. 验证磁盘空间
3. 检查源文件路径

```json
{
  "success": false,
  "error": {
    "code": "COPY_FAILED",
    "message": "文件复制失败：权限不足",
    "details": {
      "file": "package.json",
      "target": "/path/to/project/package.json",
      "reason": "Permission denied"
    }
  }
}
```

### REPLACE_FAILED

**说明：** 变量替换失败

**原因：**
- 变量未定义
- 文件编码问题
- 正则表达式错误

**解决方案：**
1. 检查 variables.json 定义
2. 验证文件编码（UTF-8）
3. 检查正则表达式

```json
{
  "success": false,
  "error": {
    "code": "REPLACE_FAILED",
    "message": "变量替换失败：未定义的变量 {{UNKNOWN_VAR}}",
    "details": {
      "file": "package.json",
      "variable": "{{UNKNOWN_VAR}}",
      "line": 5
    }
  }
}
```

### VALIDATION_FAILED

**说明：** 文件验证失败

**原因：**
- 关键文件缺失
- 文件内容为空
- 仍有未替换的变量

**解决方案：**
1. 检查关键文件列表
2. 验证文件内容非空
3. 检查所有变量已替换

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "验证失败：关键文件缺失",
    "details": {
      "missing_files": ["README.md"],
      "unreplaced_variables": ["{{PROJECT_NAME}}"]
    }
  }
}
```

## 错误处理最佳实践

### 1. 尽早验证

```javascript
// 在开始之前验证所有输入
function validateInput(input) {
  const errors = [];
  if (!input.template_id) errors.push('缺少 template_id');
  if (!input.project_info?.name) errors.push('缺少项目名称');
  if (!input.target_dir) errors.push('缺少目标目录');
  
  if (errors.length > 0) {
    throw new Error(`输入验证失败：${errors.join(', ')}`);
  }
}
```

### 2. 提供详细信息

```javascript
// 错误信息要具体
throw new Error(`文件复制失败：${sourcePath} → ${targetPath}\n原因：${error.message}`);
```

### 3. 记录错误上下文

```javascript
// 记录错误发生的位置
const errorContext = {
  code: 'COPY_FAILED',
  file: filePath,
  operation: 'copy',
  timestamp: new Date().toISOString()
};
```

### 4. 友好的错误提示

```javascript
// 对用户友好的错误提示
const userMessage = `无法找到模板 "${templateId}"\n\n可用的模板有：\n${templates.join('\n')}`;
```

## 恢复策略

### 策略 1：回滚

```javascript
// 如果失败，删除已创建的文件
try {
  await copyTemplate();
} catch (error) {
  await cleanup(targetDir);
  throw error;
}
```

### 策略 2：重试

```javascript
// 对于临时错误，重试
async function copyWithRetry(source, target, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await copy(source, target);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}
```

### 策略 3：部分成功

```javascript
// 记录哪些文件成功，哪些失败
const result = {
  success: false,
  filesCopied: successfulFiles,
  filesFailed: failedFiles,
  partialSuccess: true
};
```
