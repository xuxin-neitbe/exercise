"""
测试 03_GitHubMCP.py 的代码结构和导入
"""

import ast
import sys
from pathlib import Path


def test_imports_local_mcp_client():
    """测试：代码使用本地 protocols.mcp.MCPClient 而非外部 hello_agents"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
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
    
    # 验证使用本地导入
    assert any("protocols.mcp" in imp and "MCPClient" in imp for imp in imports_found), \
        f"应该使用 'from protocols.mcp import MCPClient'，但找到：{imports_found}"
    
    # 验证不使用外部导入
    for imp in imports_found:
        assert "hello_agents" not in imp, \
            f"不应该使用外部导入 'hello_agents'，但找到：{imp}"


def test_uses_async_main_pattern():
    """测试：代码使用异步 main 函数模式"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证有 async def main
    assert "async def main" in source, "应该使用 'async def main' 函数模式"
    
    # 验证有 asyncio.run
    assert "asyncio.run(main())" in source, "应该使用 'asyncio.run(main())' 运行主函数"
    
    # 验证有 if __name__ == "__main__" 保护
    assert 'if __name__ == "__main__"' in source, "应该使用 'if __name__ == \"__main__\"' 保护"


def test_uses_async_with_context_manager():
    """测试：代码使用 async with 上下文管理器"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用 async with
    assert "async with" in source, "应该使用 'async with' 上下文管理器管理连接"


def test_uses_await_for_async_calls():
    """测试：代码使用 await 调用异步方法"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用 await
    assert "await github_client.list_tools()" in source, \
        "应该使用 'await github_client.list_tools()'"
    assert "await github_client.call_tool" in source, \
        "应该使用 'await github_client.call_tool'"


def test_uses_http_remote_github_mcp_server():
    """测试：代码使用远程 HTTP 方式的官方 GitHub MCP 服务器"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用远程 HTTP 服务器 URL
    assert "https://api.githubcopilot.com/mcp" in source, \
        "应该使用远程 HTTP 服务器：https://api.githubcopilot.com/mcp/"
    
    # 验证不使用 go run 方式
    assert "go run" not in source, "不应该使用 'go run' 方式"
    
    # 验证不使用 docker 方式
    assert "docker run" not in source, "不应该使用 'docker run' 方式"


def test_uses_new_official_github_mcp_server():
    """测试：代码使用新的官方 GitHub MCP 服务器而非已弃用的包"""
    script_path = Path(__file__).parent.parent / "03_GitHubMCP.py"
    
    with open(script_path, "r", encoding="utf-8") as f:
        source = f.read()
    
    # 验证使用新的官方包（go run 方式或 docker 方式或 http 方式）
    # 官方推荐：go run github.com/github/github-mcp-server/cmd/github-mcp-server
    # 或远程 HTTP: https://api.githubcopilot.com/mcp/
    assert "github-mcp-server" in source or "github.com/github/github-mcp-server" in source or "api.githubcopilot.com" in source, \
        "应该使用新的官方 GitHub MCP 服务器：github-mcp-server 或远程 HTTP"
    
    # 验证不使用已弃用的包
    assert "@modelcontextprotocol/server-github" not in source, \
        "不应该使用已弃用的包：@modelcontextprotocol/server-github"


if __name__ == "__main__":
    # 运行测试
    test_imports_local_mcp_client()
    print("✅ test_imports_local_mcp_client 通过")
    
    test_uses_async_main_pattern()
    print("✅ test_uses_async_main_pattern 通过")
    
    test_uses_async_with_context_manager()
    print("✅ test_uses_async_with_context_manager 通过")
    
    test_uses_await_for_async_calls()
    print("✅ test_uses_await_for_async_calls 通过")
    
    # 新测试：验证使用远程 HTTP 服务器
    test_uses_http_remote_github_mcp_server()
    print("✅ test_uses_http_remote_github_mcp_server 通过")
    
    test_uses_new_official_github_mcp_server()
    print("✅ test_uses_new_official_github_mcp_server 通过")
    
    print("\n所有测试通过！现在可以修改代码了。")
