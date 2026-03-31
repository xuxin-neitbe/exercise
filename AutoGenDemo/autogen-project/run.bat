@echo off
REM AutoGen 软件团队启动脚本
REM 使用虚拟环境运行

cd /d "%~dp0"

REM 激活虚拟环境
call .venv\Scripts\activate.bat

REM 运行程序
python autogen_software_team.py

pause
