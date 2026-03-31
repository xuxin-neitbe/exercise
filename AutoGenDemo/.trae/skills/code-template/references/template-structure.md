# 模板文件结构

## 目录结构

```
.trae/templates/
├── registry.json                    # 模板注册表
└── nodejs-express-react/           # Node.js 模板
    ├── metadata.json               # 模板元数据
    ├── variables.json              # 变量定义
    └── files/                      # 模板文件
        ├── apps/
        │   ├── server/
        │   │   ├── src/
        │   │   ├── package.json
        │   │   └── Dockerfile
        │   └── web/
        │       ├── src/
        │       ├── index.html
        │       └── Dockerfile
        ├── package.json
        ├── README.md
        └── docker-compose.yml
```

## registry.json

**位置：** `.trae/templates/registry.json`

**作用：** 注册所有可用模板

**格式：**

```json
{
  "version": "1.0.0",
  "templates": [
    {
      "id": "nodejs-express-react",
      "name": "Node.js + Express + React",
      "description": "全栈 JavaScript 项目模板",
      "path": "./nodejs-express-react",
      "tags": ["nodejs", "express", "react"],
      "recommended": true
    },
    {
      "id": "java-springboot-vue",
      "name": "Java Spring Boot + Vue",
      "description": "企业级 Java 项目模板",
      "path": "./java-springboot-vue",
      "tags": ["java", "springboot", "vue"],
      "recommended": false
    }
  ]
}
```

**字段说明：**
- `id` - 模板唯一标识符
- `name` - 模板显示名称
- `description` - 模板描述
- `path` - 模板目录路径
- `tags` - 标签数组
- `recommended` - 是否推荐

## metadata.json

**位置：** `.trae/templates/{template_id}/metadata.json`

**作用：** 模板元数据信息

**格式：**

```json
{
  "id": "nodejs-express-react",
  "name": "Node.js + Express + React",
  "version": "1.0.0",
  "description": "全栈 JavaScript 项目模板",
  "author": "Project Builder Team",
  "tags": ["nodejs", "express", "react", "fullstack"],
  "created_at": "2026-03-07",
  "updated_at": "2026-03-08",
  "files_count": 45,
  "size_kb": 128
}
```

## variables.json

**位置：** `.trae/templates/{template_id}/variables.json`

**作用：** 定义模板需要的变量

**格式：**

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

**字段说明：**
- `required` - 必填变量列表
- `optional` - 可选变量列表
- `auto_generated` - 自动生成变量列表
- `file_patterns` - 文件类型与变量的映射

## files/ 目录

**位置：** `.trae/templates/{template_id}/files/`

**作用：** 存放模板文件

**规则：**

1. **保持项目结构** - files/ 目录内的结构与最终项目结构一致
2. **使用变量** - 在文件内容中使用 `{{VARIABLE_NAME}}` 格式
3. **文件名变量** - 文件名也可以包含变量，如 `{{PROJECT_NAME}}.yaml`
4. **二进制文件** - 二进制文件（图片等）直接复制，不替换变量

**示例：**

```
files/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   └── index.ts          # 包含 {{PROJECT_NAME}}
│   │   ├── package.json          # 包含 {{PROJECT_NAME}}, {{VERSION}}
│   │   └── Dockerfile            # 包含 {{ACR_REGISTRY}}
│   └── web/
│       ├── src/
│       │   └── App.tsx
│       ├── index.html
│       └── Dockerfile
├── .trae/
│   ├── flow-yunxiao.yml          # 云效流水线配置
│   └── deployments/
│       ├── namespace.yaml
│       └── deployments.yaml
├── package.json
├── README.md                      # 包含 {{PROJECT_NAME}}, {{DESCRIPTION}}
└── docker-compose.yml
```

## 模板验证

**验证清单：**

- [ ] registry.json 格式正确
- [ ] metadata.json 包含所有必填字段
- [ ] variables.json 定义了所有需要的变量
- [ ] files/ 目录非空
- [ ] 所有变量使用 `{{...}}` 格式
- [ ] 无硬编码的项目特定信息

**验证脚本：**

```javascript
async function validateTemplate(templateId) {
  // 1. 验证 registry.json
  const registry = await readJSON('.trae/templates/registry.json');
  const template = registry.templates.find(t => t.id === templateId);
  if (!template) throw new Error('模板未注册');
  
  // 2. 验证 metadata.json
  const metadata = await readJSON(`.trae/templates/${templateId}/metadata.json`);
  const required = ['id', 'name', 'description'];
  for (const field of required) {
    if (!metadata[field]) throw new Error(`metadata.json 缺少字段：${field}`);
  }
  
  // 3. 验证 variables.json
  const variables = await readJSON(`.trae/templates/${templateId}/variables.json`);
  if (!variables.required) throw new Error('variables.json 缺少 required 字段');
  
  // 4. 验证 files/ 目录
  const files = glob(`.trae/templates/${templateId}/files/**/*`);
  if (files.length === 0) throw new Error('files/ 目录为空');
  
  console.log(`✅ 模板 ${templateId} 验证通过`);
}
```

## 模板更新

**更新流程：**

1. 修改 files/ 目录中的文件
2. 更新 metadata.json 的 `updated_at` 字段
3. 增加 metadata.json 的 `version` 字段
4. 更新 variables.json（如有需要）
5. 测试模板
6. 提交变更

**版本控制：**

```json
{
  "version": "1.0.0",  // 语义化版本：major.minor.patch
  "updated_at": "2026-03-08",
  "changelog": [
    "2026-03-08: 初始版本",
    "2026-03-09: 添加 Docker 配置"
  ]
}
```
