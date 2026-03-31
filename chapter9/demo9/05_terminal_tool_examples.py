"""
TerminalTool 使用示例

展示 TerminalTool 的典型使用模式：
1. 探索式导航
2. 数据文件分析
3. 日志文件分析
4. 代码库分析
"""

import os
import platform
from pathlib import Path
from tools.builtin.terminal_tool import TerminalTool

# 获取脚本所在目录
SCRIPT_DIR = Path(__file__).parent.absolute()

# 检测操作系统
def is_windows():
    return platform.system().lower() == "windows"

# 获取合适的操作系统类型
def get_os_type():
    if is_windows():
        try:
            import subprocess
            result = subprocess.run(
                "which ls",
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            if result.stdout and result.returncode == 0:
                return "linux"
        except:
            pass
        return "windows"
    return "linux"

OS_TYPE = get_os_type()

# 跨平台命令映射
def get_command(unix_cmd, windows_cmd):
    return windows_cmd if OS_TYPE == "windows" else unix_cmd


def demo_exploratory_navigation():
    """演示探索式导航"""
    print("\n" + "=" * 80)
    print("场景1: 探索式导航")
    print("=" * 80 + "\n")

    terminal = TerminalTool(workspace=str(SCRIPT_DIR), os_type=OS_TYPE)

    print(f"当前操作系统模式: {OS_TYPE}")

    # 第一步:查看当前目录
    print("\n1. 查看当前目录:")
    cmd = get_command("ls -la", "dir")
    result = terminal.run({"command": cmd})
    print(result)

    # 第二步:查看Python文件
    print("\n2. 查看Python文件:")
    cmd = get_command("ls -la *.py", "dir *.py")
    result = terminal.run({"command": cmd})
    print(result)

    # 第三步:查找特定文件
    print("\n3. 查找特定模式的文件:")
    cmd = get_command("find . -name '*codebase_maintainer.py'", "dir /s /b *codebase_maintainer.py 2>nul")
    result = terminal.run({"command": cmd})
    print(result)

    # 第四步:查看文件内容
    print("\n4. 查看文件内容:")
    cmd = get_command("head -n 20 codebase_maintainer.py", "type codebase_maintainer.py")
    result = terminal.run({"command": cmd})
    print(result)


def demo_data_file_analysis():
    """演示数据文件分析"""
    print("\n" + "=" * 80)
    print("场景2: 数据文件分析")
    print("=" * 80 + "\n")

    terminal = TerminalTool(workspace=str(SCRIPT_DIR / "data"), os_type=OS_TYPE)

    # 查看 CSV 文件的前几行
    print("1. 查看 CSV 文件前5行:")
    cmd = get_command("head -n 5 sales_2024.csv", "type sales_2024.csv")
    result = terminal.run({"command": cmd})
    print(result)

    # 统计总行数
    print("\n2. 统计文件行数:")
    cmd = get_command("wc -l *.csv", "find /c /v \"\" *.csv 2>nul")
    result = terminal.run({"command": cmd})
    print(result)

    # 提取和统计产品类别
    print("\n3. 统计产品类别分布:")
    cmd = get_command("tail -n +2 sales_2024.csv | cut -d',' -f3 | sort | uniq -c", "type sales_2024.csv 2>nul")
    result = terminal.run({"command": cmd})
    print(result)


def demo_log_analysis():
    """演示日志文件分析"""
    print("\n" + "=" * 80)
    print("场景3: 日志文件分析")
    print("=" * 80 + "\n")

    terminal = TerminalTool(workspace=str(SCRIPT_DIR / "logs"), os_type=OS_TYPE)

    # 查看最新的错误日志
    print("1. 查看最新的错误日志:")
    cmd = get_command("tail -n 50 app.log | grep ERROR", "type app.log 2>nul | findstr ERROR")
    result = terminal.run({"command": cmd})
    print(result)

    # 统计错误类型分布
    print("\n2. 统计错误类型分布:")
    cmd = get_command("grep ERROR app.log | awk '{print $4}' | sort | uniq -c | sort -rn", "type app.log 2>nul | findstr ERROR")
    result = terminal.run({"command": cmd})
    print(result)

    # 查找特定时间段的日志
    print("\n3. 查找特定时间段的日志:")
    cmd = get_command("grep '2024-01-19 15:' app.log | tail -n 20", "type app.log 2>nul | findstr \"2024-01-19 15:\"")
    result = terminal.run({"command": cmd})
    print(result)


def demo_codebase_analysis():
    """演示代码库分析"""
    print("\n" + "=" * 80)
    print("场景4: 代码库分析")
    print("=" * 80 + "\n")

    terminal = TerminalTool(workspace=str(SCRIPT_DIR / "codebase"), os_type=OS_TYPE)

    # 统计代码行数
    print("1. 统计代码行数:")
    cmd = get_command("find . -name '*.py' -exec wc -l {} + | tail -n 1", "dir /s /b *.py 2>nul")
    result = terminal.run({"command": cmd})
    print(result)

    # 查找所有 TODO 注释
    print("\n2. 查找所有 TODO 注释:")
    cmd = get_command("grep -rn 'TODO' --include='*.py'", "findstr /s /n \"TODO\" *.py 2>nul")
    result = terminal.run({"command": cmd})
    print(result)

    # 查找特定函数的定义
    print("\n3. 查找特定函数的定义:")
    cmd = get_command("grep -rn 'def process_data' --include='*.py'", "findstr /s /n \"def process_data\" *.py 2>nul")
    result = terminal.run({"command": cmd})
    print(result)


def demo_security_features():
    """演示安全特性"""
    print("\n" + "=" * 80)
    print("安全特性演示")
    print("=" * 80 + "\n")

    terminal = TerminalTool(workspace=str(SCRIPT_DIR / "project"), os_type=OS_TYPE)

    # 尝试执行不允许的命令
    print("1. 尝试执行危险命令 (rm/del):")
    cmd = get_command("rm -rf /", "del /s /q *.*")
    result = terminal.run({"command": cmd})
    print(result)

    # 尝试访问工作目录外的文件
    print("\n2. 尝试访问工作目录外的文件:")
    cmd = get_command("cat /etc/passwd", "type C:\\Windows\\System32\\drivers\\etc\\hosts")
    result = terminal.run({"command": cmd})
    print(result)

    # 尝试逃逸工作目录
    print("\n3. 尝试通过 .. 逃逸工作目录:")
    cmd = get_command("cd ../../../etc", "cd ..\\..\\..\\Windows")
    result = terminal.run({"command": cmd})
    print(result)


def main():
    print("=" * 80)
    print("TerminalTool 使用示例")
    print("=" * 80)
    print(f"自动检测操作系统模式: {OS_TYPE}")

    # 演示各种使用场景
    demo_exploratory_navigation()
    demo_data_file_analysis()
    demo_log_analysis()
    demo_codebase_analysis()
    demo_security_features()

    print("\n" + "=" * 80)
    print("演示完成!")
    print("=" * 80)


if __name__ == "__main__":
    main()
