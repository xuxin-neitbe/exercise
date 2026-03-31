"""
测试 05_UseMCPToolInAgent.py 的代码结构和导入
"""

import ast
import sys
from pathlib import Path


def test_imports_local_agents():
    """测试：代码使用本地 agents 模块而非外部 hello_agents"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    tree = ast.parse(source)
    
    # 查找所有导入语句
    imports_found = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            module = node.module or ""
            names = [alias.name for alias in node.names]
            imports_found.append(f"from {module} import {', '.join(names)}")
        elif isinstance(node, ast.Import):
            names = [alias.name for alias in node.names]
            imports_found.append(f"import {', '.join(names)}")
    
    # 验证使用本地导入
    assert any("from agents import" in imp for imp in imports_found), \
        f"应该使用本地 agents 模块导入，找到：{imports_found}"
    
    assert any("from core import" in imp for imp in imports_found), \
        f"应该使用本地 core 模块导入，找到：{imports_found}"
    
    assert any("from tools import" in imp for imp in imports_found), \
        f"应该使用本地 tools 模块导入，找到：{imports_found}"
    
    # 验证不使用外部导入
    for imp in imports_found:
        assert "hello_agents" not in imp, \
            f"不应该使用外部导入 'hello_agents'，但找到：{imp}"


def test_uses_correct_mcp_tool_import():
    """测试：代码使用正确的 MCPTool 导入方式（从 tools 模块）"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用 from tools import MCPTool
    assert "from tools import MCPTool" in source, \
        "应该使用 'from tools import MCPTool' 导入"
    
    # 验证不使用错误的导入方式
    assert "from agents.tools import MCPTool" not in source, \
        "不应该使用错误的导入方式 'from agents.tools import MCPTool'"


def test_imports_simpleagent_from_agents():
    """测试：代码从 agents 模块导入 SimpleAgent"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证从 agents 导入 SimpleAgent
    assert "from agents import" in source and "SimpleAgent" in source, \
        "应该从 agents 模块导入 SimpleAgent"


def test_imports_helloagentsllm_from_core():
    """测试：代码从 core 模块导入 HelloAgentsLLM"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证从 core 导入 HelloAgentsLLM
    assert ("from core import" in source and "HelloAgentsLLM" in source) or \
           ("from core.llm import" in source and "HelloAgentsLLM" in source), \
        "应该从 core 模块导入 HelloAgentsLLM"


def test_creates_agent_with_simpleagent():
    """测试：代码创建 SimpleAgent 实例"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证创建 SimpleAgent 实例
    assert "SimpleAgent(" in source, "应该创建 SimpleAgent 实例"
    assert "name=" in source, "应该设置 agent 名称"
    assert "llm=" in source, "应该设置 llm 参数"


def test_uses_add_tool_method():
    """测试：代码使用 agent.add_tool() 方法添加工具"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用 add_tool 方法
    assert ".add_tool(" in source, "应该使用 agent.add_tool() 方法添加工具"


def test_creates_mcp_tool_instance():
    """测试：代码创建 MCPTool 实例"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证创建 MCPTool 实例
    assert "MCPTool(" in source, "应该创建 MCPTool 实例"


def test_uses_multiple_mcp_servers():
    """测试：代码演示使用多个 MCP 服务器"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证演示多个 MCP 服务器
    assert "server_command" in source, "应该使用 server_command 参数"
    assert "name=" in source, "应该为不同服务器指定不同的 name"


def test_runs_agent_with_input():
    """测试：代码调用 agent.run() 方法"""
    script_path = Path(__file__).parent.parent / "05_UseMCPToolInAgent.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证调用 agent.run()
    assert ".run(" in source, "应该调用 agent.run() 方法"


def test_agents_module_uses_absolute_imports():
    """测试：agents 模块使用本地绝对导入而非相对导入"""
    agents_dir = Path(__file__).parent.parent / "agents"
    
    for py_file in agents_dir.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        with open(py_file, "r", encoding="utf-8") as f:
            source = f.read()
        
        # 验证不使用 .. 相对导入（除了模块内部的 . 导入）
        lines = source.split("\n")
        for line in lines:
            line = line.strip()
            if line.startswith("from .."):
                assert False, f"{py_file.name} 使用了相对导入：{line}，应该使用绝对导入"
        
        # 验证使用绝对导入
        assert any("from core." in line or "from core " in line for line in lines) or \
               py_file.name == "__init__.py", \
            f"{py_file.name} 应该使用从 core 的绝对导入"


if __name__ == "__main__":
    # 运行测试
    test_imports_local_agents()
    print("✅ test_imports_local_agents 通过")
    
    test_uses_correct_mcp_tool_import()
    print("✅ test_uses_correct_mcp_tool_import 通过")
    
    test_imports_simpleagent_from_agents()
    print("✅ test_imports_simpleagent_from_agents 通过")
    
    test_imports_helloagentsllm_from_core()
    print("✅ test_imports_helloagentsllm_from_core 通过")
    
    test_creates_agent_with_simpleagent()
    print("✅ test_creates_agent_with_simpleagent 通过")
    
    test_uses_add_tool_method()
    print("✅ test_uses_add_tool_method 通过")
    
    test_creates_mcp_tool_instance()
    print("✅ test_creates_mcp_tool_instance 通过")
    
    test_uses_multiple_mcp_servers()
    print("✅ test_uses_multiple_mcp_servers 通过")
    
    test_runs_agent_with_input()
    print("✅ test_runs_agent_with_input 通过")
    
    test_agents_module_uses_absolute_imports()
    print("✅ test_agents_module_uses_absolute_imports 通过")
    
    print("\n🎉 所有测试通过！")
