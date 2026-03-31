@echo off
REM ========================================
REM VS Code 调试启动器
REM 自动使用 .venv 虚拟环境
REM ========================================

cd /d "%~dp0"

REM 检查虚拟环境是否存在
if not exist ".venv\Scripts\python.exe" (
    echo ❌ 虚拟环境不存在，正在创建...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install python-dotenv autogen-agentchat "autogen-ext[openai]" openai -i https://pypi.org/simple
    echo ✅ 虚拟环境创建完成
) else (
    REM 激活虚拟环境
    call .venv\Scripts\activate.bat
)

echo.
echo ========================================
echo 🔧 使用虚拟环境: .venv
echo 🐍 Python: %PYTHON%
echo ========================================
echo.

REM 运行传入的脚本或默认脚本
if "%~1"=="" (
    python autogen_software_team.py
) else (
    python "%~1"
)

echo.
echo ========================================
echo ✅ 程序执行完成
echo ========================================
pause
