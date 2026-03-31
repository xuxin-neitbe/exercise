# 🔧 解决 ModuleNotFoundError 问题

## ✅ 已完成的配置

1. 虚拟环境：`.venv/` (已安装所有依赖)
2. VS Code 配置：`.vscode/settings.json`
3. 调试配置：`.vscode/launch.json`
4. 启动脚本：`run.bat`, `debug.bat`

## 🚀 使用方法（3 种方式）

### 方法 1：使用启动脚本（最简单，推荐）

**直接运行：**
```bash
./run.bat
```

**或双击 `run.bat` 文件**

这会自动激活虚拟环境并运行 `autogen_software_team.py`。

---

### 方法 2：使用 VS Code 调试（需要配置）

**步骤：**

1. **重新加载 VS Code 窗口**（必须！）
   - 按 `Ctrl+Shift+P`
   - 输入 `Developer: Reload Window`
   - 按 Enter

2. **选择 Python 解释器**
   - 按 `Ctrl+Shift+P`
   - 输入 `Python: Select Interpreter`
   - 选择 `.venv/Scripts/python.exe`

3. **开始调试**
   - 按 `F5` 选择调试配置
   - 或直接按 `Ctrl+F5` 运行

---

### 方法 3：手动激活虚拟环境

**Git Bash / PowerShell：**
```bash
# 激活虚拟环境
source .venv/Scripts/activate

# 或 Windows CMD
.venv\Scripts\activate

# 验证
python -c "import dotenv; print('✅ Success')"

# 运行程序
python autogen_software_team.py
```

---

## 📝 验证配置

运行以下命令验证虚拟环境是否正确：

```bash
# 检查虚拟环境中的 Python
./.venv/Scripts/python -c "import dotenv; print('✅ 虚拟环境正常')"

# 检查当前使用的 Python
python -c "import sys; print(sys.executable)"
```

第一个命令应该显示 `✅ 虚拟环境正常`。
第二个命令应该显示 `.venv/Scripts/python.exe`（如果已激活虚拟环境）。

---

## ⚠️ 常见问题

### Q1: 调试时仍报错 ModuleNotFoundError

**原因：** VS Code 没有使用虚拟环境的 Python

**解决：**
1. 按 `Ctrl+Shift+P`
2. 输入 `Python: Select Interpreter`
3. 选择 `.venv/Scripts/python.exe`
4. 重新加载窗口（`Developer: Reload Window`）

### Q2: 终端中 python 命令仍使用系统 Python

**原因：** 虚拟环境未激活

**解决：**
```bash
# Git Bash
source .venv/Scripts/activate

# Windows CMD
.venv\Scripts\activate

# PowerShell
.venv\Scripts\Activate.ps1
```

### Q3: 不想配置 VS Code，只想快速运行

**解决：** 直接双击 `run.bat` 文件！

---

## 📦 已安装的依赖

- ✅ autogen-agentchat
- ✅ autogen-ext[openai]
- ✅ openai
- ✅ python-dotenv
- ✅ asyncio
- ✅ 其他相关依赖

---

## 🎯 推荐工作流程

1. **开发调试：** 使用方法 2（VS Code 调试），配置一次后每次按 F5 即可
2. **快速测试：** 使用方法 1（run.bat），双击即运行
3. **命令行：** 使用方法 3（手动激活），适合高级用户

---

**最后更新：** 2026-03-08
