# 🔧 VS Code 调试配置指南

## ⚠️ 问题说明

VS Code 调试器默认使用系统 Python 而不是虚拟环境，导致 `ModuleNotFoundError` 错误。

---

## ✅ 解决方案（3 种方法）

### 方法 1：使用 VS Code 调试配置（推荐）

**步骤：**

1. **打开工作区**
   - 在 VS Code 中打开 `d:\Projects\AutoGenDemo\autogen-project` 文件夹

2. **选择 Python 解释器**
   - 按 `Ctrl+Shift+P`
   - 输入 `Python: Select Interpreter`
   - 选择 `.venv\Scripts\python.exe`

3. **重新加载窗口**
   - 按 `Ctrl+Shift+P`
   - 输入 `Developer: Reload Window`
   - 按 Enter

4. **开始调试**
   - 按 `F5`
   - 选择 `Python: AutoGen Debug` 配置
   - 断点现在应该生效了！

---

### 方法 2：使用调试启动脚本

**步骤：**

1. **双击运行** `start_debug.bat`
   ```bash
   ./start_debug.bat
   ```

2. **在 VS Code 中附加到进程**
   - 按 `Ctrl+Shift+P`
   - 输入 `Debug: Attach to Python Process`
   - 选择正在运行的进程

---

### 方法 3：终端调试（最简单）

**步骤：**

1. **打开终端**
   - 在 VS Code 中按 `` Ctrl+` `` 打开终端

2. **激活虚拟环境**
   ```bash
   # Git Bash
   source .venv/Scripts/activate
   
   # Windows CMD
   .venv\Scripts\activate
   
   # PowerShell
   .venv\Scripts\Activate.ps1
   ```

3. **验证虚拟环境**
   ```bash
   python -c "import sys; print(sys.executable)"
   # 应该显示：D:\Projects\AutoGenDemo\autogen-project\.venv\Scripts\python.exe
   ```

4. **运行程序**
   ```bash
   python autogen_software_team.py
   ```

---

## 🔍 验证配置

### 检查 Python 路径
```bash
python -c "import sys; print(sys.executable)"
```
应该显示虚拟环境的路径。

### 检查 dotenv 模块
```bash
python -c "import dotenv; print('✅ dotenv 正常')"
```
应该显示 `✅ dotenv 正常`。

---

## ⚡ 快速调试命令

### 在 VS Code 中：
1. 按 `F5` → 开始调试
2. 按 `F9` → 切换断点
3. 按 `F10` → 单步执行
4. 按 `Shift+F5` → 停止调试

### 在终端中：
```bash
# 激活虚拟环境并运行
source .venv/Scripts/activate && python autogen_software_team.py
```

---

## 🐛 常见问题

### Q1: 断点不生效？
**解决：**
- 确保已选择正确的 Python 解释器（`.venv\Scripts\python.exe`）
- 重新加载 VS Code 窗口
- 使用 `F5` 启动调试而不是直接运行

### Q2: 仍然报 ModuleNotFoundError？
**解决：**
```bash
# 手动激活虚拟环境
.venv\Scripts\activate

# 重新安装依赖
pip install -r requirements.txt
```

### Q3: VS Code 不使用 .vscode 配置？
**解决：**
- 关闭 VS Code
- 删除 `.vscode/.env` 文件（如果存在）
- 重新打开 VS Code
- 重新加载窗口

---

## 📝 配置说明

### launch.json 关键配置：
```json
{
    "python": "D:\\Projects\\AutoGenDemo\\autogen-project\\.venv\\Scripts\\python.exe",
    "env": {
        "VIRTUAL_ENV": "D:\\Projects\\AutoGenDemo\\autogen-project\\.venv"
    },
    "envFile": "${workspaceFolder}/.env"
}
```

- `python`: 强制使用虚拟环境的 Python
- `VIRTUAL_ENV`: 设置虚拟环境变量
- `envFile`: 加载 `.env` 文件中的环境变量

---

## ✅ 成功标志

调试启动后应该看到：
```
🔧 正在初始化模型客户端...
👥 正在创建智能体团队...
🚀 启动 AutoGen 软件开发团队协作...
```

如果看到 `ModuleNotFoundError`，说明虚拟环境未正确激活。

---

**最后更新：** 2026-03-08
