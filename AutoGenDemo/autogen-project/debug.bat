@echo off
REM 调试启动脚本
REM 使用虚拟环境

cd /d "%~dp0"

REM 激活虚拟环境
call .venv\Scripts\activate.bat

REM 运行当前文件（通过参数传递）
if "%~1"=="" (
    echo 用法：debug.bat [脚本文件名]
    echo 示例：debug.bat autogen_software_team.py
    pause
    exit /b 1
)

python "%~1"

pause
