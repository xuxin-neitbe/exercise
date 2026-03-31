# 修复导入错误计划

## 问题分析

错误信息：
```
ModuleNotFoundError: No module named 'agents'
```

### 问题根因

1. 文件位置：`d:\Projects\chapter9\demo9\04_note_tool_integration.py`
2. 模块位置：`d:\Projects\chapter9\agents\`、`d:\Projects\chapter9\context\` 等
3. 当从 `demo9` 目录运行脚本时，Python 无法找到父目录中的模块

### 当前文件规范检查

文件已经修复了以下规范问题：
- ✅ 所有导入在文件顶部
- ✅ 导入顺序正确
- ✅ 没有在 from 导入前执行代码
- ✅ 使用了绝对导入

## 修复方案

### 方案：在导入前添加项目根目录到 sys.path

**修改内容：**

1. 在文件开头（导入语句之前）添加代码，将项目根目录添加到 `sys.path`
2. 这样可以确保 Python 能够找到 `agents`、`context`、`core`、`tools` 等模块

**具体步骤：**

1. 在 `04_note_tool_integration.py` 文件顶部，在所有导入语句之前添加：
   ```python
   import sys
   from pathlib import Path
   
   # 添加项目根目录到 sys.path
   project_root = Path(__file__).parent.parent
   sys.path.insert(0, str(project_root))
   ```

2. 确保这段代码在所有其他导入之前执行

## 验证步骤

1. 运行 `python demo9/04_note_tool_integration.py` 验证导入是否成功
2. 确保脚本能够正常执行

## 注意事项

- 这段代码需要放在所有导入语句之前
- 使用 `pathlib` 来处理路径，确保跨平台兼容性
- 保持代码简洁，只添加必要的路径设置
