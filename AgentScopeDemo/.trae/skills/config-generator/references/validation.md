# 验证规则

## YAML 格式验证

### 验证方法

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

function validateYaml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = yaml.load(content);
    return { valid: true, data: doc };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      line: error.mark?.line,
      column: error.mark?.column
    };
  }
}
```

### 常见错误

**错误 1：缩进错误**

```yaml
# 错误
apiVersion: v1
kind: Namespace
  metadata:  # 缩进错误
    name: my-shop

# 正确
apiVersion: v1
kind: Namespace
metadata:
  name: my-shop
```

**错误 2：冒号后缺少空格**

```yaml
# 错误
metadata:
  name:my-shop  # 缺少空格

# 正确
metadata:
  name: my-shop
```

**错误 3：列表格式错误**

```yaml
# 错误
images:
- image1
- image2

# 正确
images:
  - image1
  - image2
```

## 必填字段验证

### namespace.yaml

```javascript
function validateNamespace(yaml) {
  const required = ['apiVersion', 'kind', 'metadata'];
  const errors = [];
  
  for (const field of required) {
    if (!yaml[field]) {
      errors.push(`缺少必填字段：${field}`);
    }
  }
  
  if (yaml.metadata && !yaml.metadata.name) {
    errors.push('缺少必填字段：metadata.name');
  }
  
  return errors;
}
```

**完整验证：**

```yaml
apiVersion: v1          # ✅ 必填
kind: Namespace         # ✅ 必填
metadata:               # ✅ 必填
  name: my-shop-prod    # ✅ 必填
  labels:               # ⚪ 可选
    app: my-shop
```

### deployment.yaml

```javascript
function validateDeployment(yaml) {
  const required = [
    'apiVersion',
    'kind',
    'metadata',
    'spec',
    'spec.replicas',
    'spec.selector',
    'spec.template'
  ];
  
  const errors = [];
  
  // 检查 apiVersion
  if (!yaml.apiVersion) {
    errors.push('缺少必填字段：apiVersion');
  } else if (!yaml.apiVersion.startsWith('apps/')) {
    errors.push(`apiVersion 错误，应该是 'apps/v1'，实际是 '${yaml.apiVersion}'`);
  }
  
  // 检查 kind
  if (!yaml.kind) {
    errors.push('缺少必填字段：kind');
  } else if (yaml.kind !== 'Deployment') {
    errors.push(`kind 错误，应该是 'Deployment'，实际是 '${yaml.kind}'`);
  }
  
  // 检查 spec
  if (!yaml.spec) {
    errors.push('缺少必填字段：spec');
  } else {
    if (!yaml.spec.replicas) {
      errors.push('缺少必填字段：spec.replicas');
    }
    if (!yaml.spec.selector) {
      errors.push('缺少必填字段：spec.selector');
    }
    if (!yaml.spec.template) {
      errors.push('缺少必填字段：spec.template');
    }
  }
  
  return errors;
}
```

**完整验证：**

```yaml
apiVersion: apps/v1           # ✅ 必填
kind: Deployment              # ✅ 必填
metadata:                     # ✅ 必填
  name: my-shop-server        # ✅ 必填
  namespace: my-shop-prod     # ✅ 必填
spec:                         # ✅ 必填
  replicas: 2                 # ✅ 必填
  selector:                   # ✅ 必填
    matchLabels:
      app: my-shop-server
  template:                   # ✅ 必填
    metadata:
      labels:
        app: my-shop-server
    spec:
      containers:
        - name: server
          image: crpi-xxx/my-shop-server:latest
```

### flow-yunxiao.yml

```javascript
function validateFlow(yaml) {
  const required = ['version', 'name', 'stages'];
  const errors = [];
  
  for (const field of required) {
    if (!yaml[field]) {
      errors.push(`缺少必填字段：${field}`);
    }
  }
  
  // 验证 stages
  if (yaml.stages) {
    if (!Array.isArray(yaml.stages)) {
      errors.push('stages 必须是数组');
    } else {
      for (let i = 0; i < yaml.stages.length; i++) {
        const stage = yaml.stages[i];
        if (!stage.name) {
          errors.push(`stages[${i}] 缺少 name 字段`);
        }
        if (!stage.steps) {
          errors.push(`stages[${i}] 缺少 steps 字段`);
        }
      }
    }
  }
  
  return errors;
}
```

## 变量替换验证

### 检查未替换的变量

```javascript
function checkUnreplacedVariables(content) {
  const pattern = /\{\{[^}]+\}\}/g;
  const matches = content.match(pattern);
  
  if (matches) {
    return {
      found: true,
      variables: [...new Set(matches)]
    };
  }
  
  return { found: false, variables: [] };
}
```

### 验证所有文件

```javascript
async function validateAllFiles(targetDir) {
  const files = glob(`${targetDir}/**/*`);
  const errors = [];
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const result = checkUnreplacedVariables(content);
    
    if (result.found) {
      errors.push({
        file: file,
        variables: result.variables
      });
    }
  }
  
  return errors;
}
```

## 配置一致性验证

### 检查命名空间一致性

```javascript
function validateNamespaceConsistency(configs) {
  const namespaces = new Set();
  
  // 从各个配置中提取命名空间
  if (configs.namespace) {
    namespaces.add(configs.namespace.metadata.name);
  }
  
  if (configs.serverDeployment) {
    namespaces.add(configs.serverDeployment.metadata.namespace);
  }
  
  if (configs.webDeployment) {
    namespaces.add(configs.webDeployment.metadata.namespace);
  }
  
  // 检查是否一致
  if (namespaces.size > 1) {
    return {
      valid: false,
      error: `命名空间不一致：${[...namespaces].join(', ')}`
    };
  }
  
  return { valid: true };
}
```

### 检查镜像地址一致性

```javascript
function validateImageConsistency(configs) {
  const images = new Set();
  
  // 从 Deployment 中提取镜像地址
  if (configs.serverDeployment) {
    const container = configs.serverDeployment.spec.template.spec.containers[0];
    images.add(container.image);
  }
  
  if (configs.webDeployment) {
    const container = configs.webDeployment.spec.template.spec.containers[0];
    images.add(container.image);
  }
  
  // 检查是否使用相同的 ACR 地址
  const acrRegistries = [...images].map(img => img.split('/')[0]);
  if (new Set(acrRegistries).size > 1) {
    return {
      valid: false,
      error: `ACR 地址不一致：${[...new Set(acrRegistries)].join(', ')}`
    };
  }
  
  return { valid: true };
}
```

## 完整验证流程

```javascript
async function validateConfigs(targetDir) {
  const errors = [];
  
  // 1. 验证 YAML 格式
  const yamlFiles = [
    '.trae/namespace.yaml',
    '.trae/server-deployment.yaml',
    '.trae/web-deployment.yaml',
    '.trae/flow-yunxiao.yml'
  ];
  
  for (const file of yamlFiles) {
    const result = validateYaml(`${targetDir}/${file}`);
    if (!result.valid) {
      errors.push({
        file: file,
        error: `YAML 格式错误：${result.error}`
      });
    }
  }
  
  // 2. 验证必填字段
  const namespace = yaml.load(fs.readFileSync(`${targetDir}/.trae/namespace.yaml`));
  const namespaceErrors = validateNamespace(namespace);
  errors.push(...namespaceErrors.map(e => ({ file: 'namespace.yaml', error: e })));
  
  const serverDeployment = yaml.load(fs.readFileSync(`${targetDir}/.trae/server-deployment.yaml`));
  const deploymentErrors = validateDeployment(serverDeployment);
  errors.push(...deploymentErrors.map(e => ({ file: 'server-deployment.yaml', error: e })));
  
  // 3. 检查未替换的变量
  const variableErrors = await validateAllFiles(targetDir);
  errors.push(...variableErrors.map(e => ({
    file: e.file,
    error: `未替换的变量：${e.variables.join(', ')}`
  })));
  
  // 4. 验证配置一致性
  const configs = {
    namespace,
    serverDeployment,
    webDeployment: yaml.load(fs.readFileSync(`${targetDir}/.trae/web-deployment.yaml`))
  };
  
  const nsConsistency = validateNamespaceConsistency(configs);
  if (!nsConsistency.valid) {
    errors.push({ file: 'all', error: nsConsistency.error });
  }
  
  const imageConsistency = validateImageConsistency(configs);
  if (!imageConsistency.valid) {
    errors.push({ file: 'all', error: imageConsistency.error });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

## 验证清单

### 开发阶段验证

- [ ] YAML 格式正确
- [ ] 必填字段完整
- [ ] 变量全部替换
- [ ] 命名空间一致
- [ ] 镜像地址一致

### 部署前验证

- [ ] 资源配置合理
- [ ] 健康检查配置
- [ ] 镜像拉取密钥配置
- [ ] 环境变量配置
- [ ] 日志配置

### 生产环境验证

- [ ] 副本数 >= 2
- [ ] 资源限制合理
- [ ] 监控配置
- [ ] 告警配置
- [ ] 备份配置

## 验证工具

### 使用 kubeval 验证 K8s 配置

```bash
# 安装
brew install kubeval

# 验证
kubeval .trae/namespace.yaml
kubeval .trae/server-deployment.yaml
kubeval .trae/web-deployment.yaml
```

### 使用 yamllint 验证 YAML 格式

```bash
# 安装
pip install yamllint

# 验证
yamllint .trae/*.yaml
```

### 自定义验证脚本

```bash
#!/bin/bash
# validate.sh

echo "验证 K8s 配置..."

# 验证 namespace
kubectl apply --dry-run=client -f .trae/namespace.yaml
if [ $? -ne 0 ]; then
  echo "❌ namespace.yaml 验证失败"
  exit 1
fi

# 验证 deployment
kubectl apply --dry-run=client -f .trae/server-deployment.yaml
if [ $? -ne 0 ]; then
  echo "❌ server-deployment.yaml 验证失败"
  exit 1
fi

echo "✅ 所有配置验证通过"
```
