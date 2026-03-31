# ✅ 最终调试解决方案

## 🎯 问题已解决！

**修改内容：** 在 `autogen_software_team.py` 中添加了自动虚拟环境路径注入功能。

---

## 🔧 工作原理

程序启动时会自动：
1. 检测 `.venv` 虚拟环境目录
2. 如果不在虚拟环境中，自动添加虚拟环境的 `site-packages` 到 Python 路径
3. 这样即使使用系统 Python，也能找到虚拟环境中的模块

**代码逻辑：**
```python
# 在任何其他导入之前
venv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.venv')
if os.path.exists(venv_path):
    if not in_venv:
        venv_site_packages = os.path.join(venv_path, 'Lib', 'site-packages')
        sys.path.insert(0, venv_site_packages)  # 关键！
```

---

## 🚀 使用方法

### 方法 1：VS Code 调试（F5）

**步骤：**
1. 打开工作区文件：`AutoGenProject.code-workspace`
2. 按 `F5` 开始调试
3. 断点现在应该正常工作了！

**预期输出：**
```
🔧 已添加虚拟环境路径：D:\Projects\AutoGenDemo\autogen-project\.venv\Lib\site-packages
🔧 正在初始化模型客户端...
👥 正在创建智能体团队...
```

---

### 方法 2：终端运行

```bash
# 在任何目录下
python autogen_software_team.py
```

程序会自动找到虚拟环境中的模块。

---

### 方法 3：双击运行

双击 `run.bat` 文件即可。

---

## ✅ 验证方法

### 1. 检查 Python 路径
在调试时添加断点，运行：
```python
import sys
print(sys.executable)
print(sys.path)
```

应该看到虚拟环境的路径在列表中。

### 2. 检查模块导入
```python
import dotenv
print(dotenv.__file__)
```

应该显示虚拟环境中的路径。

---

## 📝 配置文件说明

### 创建的文件：

1. **`.python-version`** - 指定 Python 解释器路径
2. **`AutoGenProject.code-workspace`** - VS Code 工作区配置
3. **`.vscode/launch.json`** - 调试配置

### 修改的文件：

1. **`autogen_software_team.py`** - 添加虚拟环境自动检测

---

## 🐛 如果还是不行

### 方案 A：使用工作区文件

1. 关闭当前 VS Code 窗口
2. 打开 `AutoGenProject.code-workspace` 文件
3. 按 `F5` 调试

### 方案 B：手动指定 Python

1. 按 `Ctrl+Shift+P`
2. 输入 `Python: Select Interpreter`
3. 选择 `.venv\Scripts\python.exe`
4. 重新加载窗口（`Ctrl+Shift+P` → `Developer: Reload Window`）
5. 按 `F5` 调试

### 方案 C：终端调试

```bash
cd d:/Projects/AutoGenDemo/autogen-project
source .venv/Scripts/activate
python -m debugpy --listen 5678 --wait-for-client autogen_software_team.py
```

然后在 VS Code 中附加到进程。

---

## 🎉 成功标志

调试启动后应该看到：
```
🔧 已添加虚拟环境路径：D:\Projects\AutoGenDemo\autogen-project\.venv\Lib\site-packages
🔧 正在初始化模型客户端...
👥 正在创建智能体团队...
🚀 启动 AutoGen 软件开发团队协作...
```

**现在按 F5 应该可以正常调试了！**

---

**最后更新：** 2026-03-08
