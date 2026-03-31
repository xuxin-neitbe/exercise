# 变量替换规则

## 变量命名规范

**格式：** `{{VARIABLE_NAME}}`

**示例：**
- `{{PROJECT_NAME}}` - 项目名称
- `{{ACR_REGISTRY}}` - ACR 镜像仓库地址
- `{{K8S_NAMESPACE}}` - K8s 命名空间

## 变量类型

### 1. 项目变量（来自用户输入）

```
{{PROJECT_NAME}}          - 项目名称（必填）
{{PROJECT_DESCRIPTION}}   - 项目描述（必填）
{{PROJECT_VERSION}}       - 版本号（默认 1.0.0）
{{PROJECT_AUTHOR}}        - 作者姓名（可选）
```

### 2. 配置变量（来自 Agent 配置）

```
{{ACR_REGISTRY}}          - ACR 镜像仓库地址
{{ACR_NAMESPACE}}         - ACR 命名空间
{{K8S_NAMESPACE}}         - K8s 命名空间
{{DEPLOYMENT_TYPE}}       - 部署类型（ACK/ECS/LOCAL）
```

### 3. 系统变量（自动生成）

```
{{TIMESTAMP}}             - ISO8601 时间戳
{{GENERATED_DATE}}        - 人类可读日期（例如：2026 年 3 月 8 日）
{{TEMPLATE_ID}}           - 使用的模板 ID
```

## 替换规则

### 规则 1：全局替换

在所有文本文件中替换变量：

```javascript
function replaceVariables(content, variableMap) {
  let result = content;
  for (const [key, value] of Object.entries(variableMap)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  }
  return result;
}
```

### 规则 2：文件名替换

如果文件名包含变量，也要替换：

```javascript
// 例如：{{PROJECT_NAME}}.yaml → my-shop.yaml
function replaceInFilename(filename, variableMap) {
  let result = filename;
  for (const [key, value] of Object.entries(variableMap)) {
    result = result.replace(key, value);
  }
  return result;
}
```

### 规则 3：转义处理

如果变量值包含特殊字符，需要转义：

```javascript
function escapeValue(value) {
  // YAML 特殊字符转义
  if (value.includes(':') || value.includes('#')) {
    return `"${value}"`;
  }
  return value;
}
```

## 变量定义文件（variables.json）

**示例：**

```json
{
  "required": [
    "{{PROJECT_NAME}}",
    "{{PROJECT_DESCRIPTION}}"
  ],
  "optional": [
    "{{PROJECT_VERSION}}",
    "{{PROJECT_AUTHOR}}"
  ],
  "auto_generated": [
    "{{TIMESTAMP}}",
    "{{GENERATED_DATE}}"
  ],
  "file_patterns": {
    "*.json": ["{{PROJECT_NAME}}", "{{PROJECT_VERSION}}"],
    "*.yaml": ["{{K8S_NAMESPACE}}", "{{ACR_REGISTRY}}"],
    "*.md": ["{{PROJECT_NAME}}", "{{PROJECT_DESCRIPTION}}"]
  }
}
```

## 验证规则

**验证 1：检查未替换变量**

```javascript
function validateNoUnreplacedVariables(content) {
  const unreplacedPattern = /\{\{[^}]+\}\}/g;
  const matches = content.match(unreplacedPattern);
  if (matches) {
    throw new Error(`发现未替换的变量：${matches.join(', ')}`);
  }
}
```

**验证 2：检查关键文件**

```javascript
const requiredFiles = ['package.json', 'README.md', 'Dockerfile'];
for (const file of requiredFiles) {
  if (!exists(targetPath + '/' + file)) {
    throw new Error(`关键文件缺失：${file}`);
  }
}
```

## 常见问题

### Q: 如何处理变量值中的特殊字符？

A: 使用转义函数处理 YAML 和 JSON 特殊字符。

### Q: 文件名包含变量如何处理？

A: 在复制文件后，检查并替换文件名中的 `{{...}}` 模式。

### Q: 如何验证替换是否完整？

A: 遍历所有文件，检查是否仍包含 `{{...}}` 模式。
