#!/usr/bin/env python3
"""简单的测试 MCP 服务器"""

from fastmcp import FastMCP

mcp = FastMCP(name="test-server")


@mcp.tool()
def hello(name: str) -> str:
    """Say hello"""
    return f"Hello, {name}!"


@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b


if __name__ == "__main__":
    mcp.run()
