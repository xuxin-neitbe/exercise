# Superpowers 框架快速参考

## 一、绝对铁律 (The Iron Laws)

### 1. NO FIX WITHOUT ROOT CAUSE
**遇到错误时，严禁直接给代码修复。必须执行 `systematic-debugging` 查明根因。**

### 2. NO PRODUCTION CODE WITHOUT RED TEST
**严禁在测试失败前写生产代码。**

### 3. NO BLIND MOCKING
**严禁测试 Mock 行为，必须测试真实行为 (Anti-pattern 1)。**

### 4. NO GUESSING THE OUTPUT
**严禁在没有实际运行命令并看到成功输出的情况下，宣布"任务完成"或"修复成功"。**

---

## 二、Trae 原生工具适配

### A. 可视化跟踪 (TodoWrite)
- 执行多步骤技能时，**第一步强制调用 `TodoWrite`**
- 将流程拆解到右侧边栏任务列表
- 每做完一步打一个勾

### B. 子代理派发 (Task)
- 执行开发计划时，**强制调用 `Task` 工具**
- 为每个独立任务分配子代理
- 严格执行**两阶段审查**：
  1. 审查 Spec 需求对齐度
  2. 审查代码质量
- 审查不通过则返工

### C. 上下文沉淀 (Memory)
- 需要跨任务记住架构决定、避坑经验时
- **强制调用 `manage_core_memory` 工具**写入 Project 级别记忆

---

## 三、核心触发器字典

### 架构与计划 (Architecture & Planning)

| 场景 | 必须调用的技能 |
|------|---------------|
| 收到新功能需求或要重构系统时 | `brainstorming` |
| 讨论完毕，需要拆解出带复选框的执行步骤时 | `writing-plans` |
| 在复杂设计中卡壳，或发现代码过度耦合时 | `when-stuck` 或 `simplification-cascades` |

### 开发与审查 (Implementation & Review)

| 场景 | 必须调用的技能 |
|------|---------------|
| 准备开始执行具体的某个功能开发时 | `subagent-driven-development` |
| **在编写第一行业务逻辑代码前** | `test-driven-development` |
| 写测试时需要用 Mock，或发现测试不可靠时 | `testing-anti-patterns` |
| 一个功能开发完，准备向下进行前 | `requesting-code-review` |

### 排错与闭环 (Debugging & Completion)

| 场景 | 必须调用的技能 |
|------|---------------|
| **代码抛出错误，或测试未通过时** | `systematic-debugging` |
| Bug 在调用栈很深的地方，需要向上找来源时 | `root-cause-tracing` |
| 写异步测试，遇到需要 sleep 或 timeout 时 | `condition-based-waiting` |
| 认为任务做完了，准备向用户报告成功前 | `verification-before-completion` |

---

## 四、防"自作聪明"机制 (Anti-Rationalization Checks)

当出现以下想法时，**立即停止当前行为，回退到规范流程**：

- ❌ *"这个问题太简单了，不需要做设计/写测试..."*
  - **错！简单问题也会破坏系统。**

- ❌ *"我先写完代码，一会再补测试..."*
  - **错！后补的测试只是验证了你的实现，而不是验证了需求。**

- ❌ *"我已经手动验证过了，应该没问题了..."*
  - **错！手动验证无法防止回归。**

---

## 五、其他重要规则

### 导入规范
- **不许在 from 导入前使用任何代码**
- **必须使用工程的绝对导入**

### 运行脚本
- 从项目根目录运行脚本
- 使用 Python 的 `-m` 选项

---

## 六、可用技能完整列表

### 开发流程类
- `test-driven-development` - TDD 开发
- `subagent-driven-development` - 子代理驱动开发
- `requesting-code-review` - 请求代码审查
- `verification-before-completion` - 完成前验证

### 排错调试类
- `systematic-debugging` - 系统性调试
- `root-cause-tracing` - 根因追踪
- `condition-based-waiting` - 条件等待
- `when-stuck` - 卡壳时的解决方案

### 规划设计类
- `brainstorming` - 头脑风暴
- `writing-plans` - 编写计划
- `simplification-cascades` - 简化级联

### 测试类
- `testing-anti-patterns` - 测试反模式

### 记忆管理类
- `manage_core_memory` - 管理核心记忆

---

**版本**: 2026-03-28 整理
**用途**: 快速查阅对照，确保遵循 Superpowers 框架规范
