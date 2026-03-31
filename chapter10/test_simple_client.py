#!/usr/bin/env python3
"""测试简单服务器"""

import asyncio
from fastmcp import Client


async def test():
    server_script = r"D:\Projects\chapter10\test_simple_server.py"
    print(f"📝 连接到：{server_script}")
    
    async with Client(server_script) as client:
        tools = await client.list_tools()
        print(f"✅ 工具数量：{len(tools.tools)}")
        
        result = await client.call_tool("hello", {"name": "World"})
        print(f"✅ hello 结果：{result}")


if __name__ == "__main__":
    asyncio.run(test())
