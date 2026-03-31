#!/usr/bin/env python
"""
VS Code 调试修复脚本
自动检测并激活虚拟环境
"""

import os
import sys
import subprocess

def check_and_activate_venv():
    """检查并激活虚拟环境"""
    
    # 检查当前是否在虚拟环境中
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ 已在虚拟环境中")
        return True
    
    # 检查 .venv 是否存在
    venv_path = os.path.join(os.path.dirname(__file__), '.venv')
    if not os.path.exists(venv_path):
        print("❌ 虚拟环境不存在，请先创建虚拟环境")
        return False
    
    # 获取虚拟环境的 Python 路径
    venv_python = os.path.join(venv_path, 'Scripts', 'python.exe')
    if not os.path.exists(venv_python):
        print("❌ 虚拟环境 Python 不存在")
        return False
    
    print(f"🔧 切换到虚拟环境: {venv_python}")
    
    # 使用虚拟环境的 Python 重新运行脚本
    script_path = os.path.join(os.path.dirname(__file__), 'autogen_software_team.py')
    
    try:
        result = subprocess.run([venv_python, script_path], 
                              capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print("✅ 程序运行成功！")
            print(result.stdout)
        else:
            print("❌ 程序运行失败")
            print("错误输出:")
            print(result.stderr)
            print("标准输出:")
            print(result.stdout)
            
    except Exception as e:
        print(f"❌ 运行失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 VS Code 调试修复脚本")
    print("=" * 50)
    
    if check_and_activate_venv():
        print("\n✅ 调试修复完成")
    else:
        print("\n❌ 调试修复失败")
        sys.exit(1)