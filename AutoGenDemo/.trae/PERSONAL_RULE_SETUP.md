# Trae 个人规则配置指南（简化版）

> **用途：** 配置到 Trae 个人规则，在所有项目中自动生效

---

## 📋 复制以下内容到 Trae 个人规则

**打开 Trae 设置 → Personal Rules → 粘贴：**

```markdown
# Trae 个人规则 - 项目初始化自动化

## 🎯 触发条件

**自动触发（同时满足）：**
1. 新 Git 仓库（有 `.git` 但无 `.trae`）
2. 首次打开项目
3. 关键词："新项目"、"创建项目"、"初始化"、"配置模板"

**手动触发：**
```
/init-project
@project-init 初始化
配置模板
```

---

## 🚀 执行流程

### 1. 环境检查
- 检查 `.git` 目录 → 无则提示初始化
- 检查 `.trae` 目录 → 已存在则提示重新配置
- 检查网络 → 失败则提示

### 2. 添加 Git 子模块
```bash
git submodule add https://codeup.aliyun.com/611f331203f23adfbed10979/neitbe/Template.git .trae
```

### 3. 初始化并提交
```bash
git submodule update --init
git add .trae .gitmodules
git commit -m "feat: 添加项目模板配置"
```

### 4. 显示指南
```
✅ 项目模板配置成功！

可用模板（8 个）：
  🌐 Web 全栈：nodejs-express-react ⭐, java-springboot-vue 🏢, 
              python-fastapi-react 🤖, go-gin-vue ⚡
  🤖 AI Agent：autogen-multi-agent ⭐, langgraph-workflow 🔗,
              agentscope-chatbot 🌟, camel-multi-agent 🎓

下一步：
  1. @project-builder 创建功能
  2. 查看 .trae/README.md
  3. git submodule update --remote .trae
```

---

## 🔄 项目创建完成后的自动提示

**当 @project-builder 创建完项目后，自动提示：**

```
🎉 项目创建完成！

💡 推荐操作：@acr-registry-setup 配置 DevOps 环境

这将帮你完成：
  ✅ 配置阿里云 ACR 私有仓库
  ✅ 推送基础镜像（Node.js、Nginx 等）
  ✅ 修改 Dockerfile 使用私有仓库地址
  ✅ 生成云效 Flow 流水线配置
  ✅ 解决 Docker Hub 限流问题

是否需要现在配置？[是] [否] [稍后]
```

**用户选择后：**
- **是** → 自动调用 @acr-registry-setup
- **稍后** → 提示使用方法：`@acr-registry-setup 配置 ACR 私有仓库`

---

## ⚠️ 错误处理

**网络问题：**
- 提示检查网络
- 提供手动命令

**权限问题：**
- 提示配置 Git 凭证
- 联系管理员

**.trae 已存在：**
- 提供选项：重新配置/更新/跳过

---

## ✅ 验证

```bash
ls -la .trae              # 检查目录
git submodule status      # 检查状态
ls .trae/templates        # 检查模板
```

---

**最后更新：** 2026-03-08
```

---

## 🔧 配置步骤

1. **打开 Trae 设置** ⚙️
2. **找到 Personal Rules**
3. **点击 Add Rule**
4. **粘贴上方规则**
5. **保存**

---

## 🧪 测试

**在新项目中：**
```bash
mkdir test-project && cd test-project
git init
# 打开 Trae，输入：
/init-project
```

应该自动执行初始化流程。

---

## 📖 完整文档

- 详细版：`.trae/PERSONAL_RULES.md`
- 使用指南：`.trae/HOW_TO_USE_IN_ANY_PROJECT.md`
- Git 子模块：`.trae/docs/GIT_SUBMODULE_EXPLAINED.md`
