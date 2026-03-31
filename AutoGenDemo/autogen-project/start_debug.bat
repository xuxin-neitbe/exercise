@echo off
REM ========================================
REM VS Code 调试启动脚本
REM 强制使用虚拟环境
REM ========================================

cd /d "%~dp0"

REM 设置虚拟环境路径
set VENV_PATH=%CD%\.venv
set VENV_PYTHON=%VENV_PATH%\Scripts\python.exe

REM 检查虚拟环境是否存在
if not exist "%VENV_PYTHON%" (
    echo ❌ 虚拟环境不存在：%VENV_PYTHON%
    echo 请先创建虚拟环境：python -m venv .venv
    pause
    exit /b 1
)

echo ========================================
echo 🔧 使用虚拟环境 Python
echo 路径：%VENV_PYTHON%
echo ========================================
echo.

REM 运行调试器
"%VENV_PYTHON%" -m debugpy --listen 5678 --wait-for-client autogen_software_team.py

pause
