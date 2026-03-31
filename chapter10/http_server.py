"""MCP 服务器 - HTTP 传输模式"""
from fastmcp import FastMCP

# 创建服务器
mcp = FastMCP("HTTPServer")

@mcp.tool()
def add(a: float, b: float) -> float:
    """加法计算器"""
    return a + b

@mcp.tool()
def greet(name: str = "World") -> str:
    """友好问候"""
    return f"Hello, {name}!"

@mcp.tool()
def list_directory(path: str = ".") -> list:
    """列出目录内容"""
    import os
    try:
        return os.listdir(path)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # 使用 HTTP 传输运行服务器（端口 8080）
    print("🚀 启动 HTTP MCP 服务器...")
    print("📍 地址：http://localhost:8080")
    print("⏹️  按 Ctrl+C 停止服务器")
    mcp.run(transport="http", host="0.0.0.0", port=8080)
