"""
MCP 传输方式示例

本文件展示了 MCPTool 支持的不同传输方式。
注意：每次只使用一种传输方式，避免多个传输对象同时创建导致的资源清理问题。

支持的传输方式：
1. Memory Transport - 内存传输（用于测试，使用内置演示服务器）
2. Stdio Transport - 标准输入输出传输（本地 Python/Node.js 脚本）
3. HTTP/SSE Transport - HTTP 传输（远程服务器）
"""

import asyncio
from tools import MCPTool
from protocols.mcp.client import MCPClient


def demo_memory_transport():
    """
    示例 1：Memory Transport - 内存传输（用于测试）
    使用内置的 FastMCP 演示服务器，无需外部依赖
    """
    print("=" * 60)
    print("示例 1：Memory Transport - 内存传输")
    print("=" * 60)
    
    # 使用内置演示服务器（Memory 传输）
    mcp_tool = MCPTool()
    
    try:
        # 列出可用工具
        result = mcp_tool.run({"action": "list_tools"})
        print(f"\n{result}")
        
        # 调用工具
        result = mcp_tool.run({
            "action": "call_tool",
            "tool_name": "add",
            "arguments": {"a": 10, "b": 20}
        })
        print(f"\n{result}")
    except Exception as e:
        print(f"内存传输测试失败：{e}")
    finally:
        # 显式清理资源
        mcp_tool = None


def demo_stdio_python_server():
    """
    示例 2：Stdio Transport - Python 脚本服务器
    使用本地 Python 脚本作为 MCP 服务器
    """
    print("\n" + "=" * 60)
    print("示例 2：Stdio Transport - Python 脚本服务器")
    print("=" * 60)
    
    try:
        # 使用自定义 Python 服务器
        # 设置 auto_expand=False 避免初始化时的工具发现
        mcp_tool = MCPTool(
            server_command=["python", "my_mcp_server.py"],
            auto_expand=False
        )
        
        # 列出工具
        result = mcp_tool.run({"action": "list_tools"})
        print(f"\n{result}")
        
        # 注意：实际使用时需要根据服务器提供的工具进行调用
        # result = mcp_tool.run({
        #     "action": "call_tool",
        #     "tool_name": "your_tool_name",
        #     "arguments": {"param": "value"}
        # })
        # print(f"\n{result}")
        
    except FileNotFoundError as e:
        print(f"服务器脚本未找到（预期行为）: {e}")
    except Exception as e:
        print(f"Python 脚本服务器测试失败：{e}")
    finally:
        mcp_tool = None


def demo_stdio_filesystem_server():
    """
    示例 3：Stdio Transport - 文件系统服务器（npx 方式）
    使用社区 MCP 服务器访问文件系统
    """
    print("\n" + "=" * 60)
    print("示例 3：Stdio Transport - 文件系统服务器")
    print("=" * 60)
    
    try:
        # 使用社区服务器（文件系统）
        # 设置 auto_expand=False 避免初始化时的工具发现，减少客户端重复创建
        mcp_tool = MCPTool(
            server_command=["npx", "-y", "@modelcontextprotocol/server-filesystem", "."],
            auto_expand=False
        )
        
        # 列出工具
        result = mcp_tool.run({"action": "list_tools"})
        print(f"\n{result}")
        
        # 调用读取文件工具（示例）
        # result = mcp_tool.run({
        #     "action": "call_tool",
        #     "tool_name": "read_file",
        #     "arguments": {"path": "README.md"}
        # })
        # print(f"\n{result}")
        
    except FileNotFoundError as e:
        print(f"npx 未找到（需要安装 Node.js）: {e}")
    except Exception as e:
        print(f"文件系统服务器测试失败：{e}")
    finally:
        mcp_tool = None


async def demo_http_transport():
    """
    示例 4：HTTP Transport - 远程 HTTP 服务器
    使用 MCPClient 直接连接远程 HTTP MCP 服务器
    """
    print("\n" + "=" * 60)
    print("示例 4：HTTP Transport - 远程 HTTP 服务器")
    print("=" * 60)
    
    # 注意：需要实际的 HTTP MCP 服务器
    # 以下是示例代码，实际使用需要替换为真实服务器 URL
    server_url = "https://api.example.com/mcp"
    
    print(f"\n连接到远程服务器：{server_url}")
    print("（示例代码，需要实际服务器才能运行）")
    
    try:
        client = MCPClient(server_url)
        
        async with client:
            # 获取服务器信息
            tools = await client.list_tools()
            print(f"远程服务器工具：{len(tools)} 个")
            
            # 调用远程工具（示例）
            # result = await client.call_tool("process_data", {
            #     "data": "Hello, World!",
            #     "operation": "uppercase"
            # })
            # print(f"远程处理结果：{result}")
            
    except Exception as e:
        print(f"HTTP 传输测试失败（预期行为，需要真实服务器）: {e}")


def main():
    """
    主函数 - 运行所有传输示例
    """
    print("MCP 传输方式演示")
    print("=" * 60)
    
    # 1. Memory Transport（总是可用）
    demo_memory_transport()
    
    # 2. Stdio Transport - Python 脚本
    demo_stdio_python_server()
    
    # 3. Stdio Transport - 文件系统服务器
    demo_stdio_filesystem_server()
    
    # 4. HTTP Transport
    asyncio.run(demo_http_transport())
    
    print("\n" + "=" * 60)
    print("演示完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()