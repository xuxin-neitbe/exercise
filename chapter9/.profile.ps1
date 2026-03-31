# Chapter9 项目 PowerShell 配置文件
# 每次进入项目目录时自动执行

# 设置 PYTHONPATH
$env:PYTHONPATH = "d:\Projects\chapter9"

Write-Host "✅ Chapter9 环境已加载 (PYTHONPATH=$env:PYTHONPATH)" -ForegroundColor Green
