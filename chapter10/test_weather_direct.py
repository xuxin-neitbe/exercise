#!/usr/bin/env python3
"""直接测试天气 MCP 服务器"""

import asyncio
from fastmcp import Client


async def test_weather():
    server_script = r"D:\Projects\chapter10\14_weather_mcp_server.py"
    
    print(f"📝 连接到服务器：{server_script}")
    
    async with Client(server_script) as client:
        # 测试列出工具
        tools = await client.list_tools()
        print(f"✅ 可用工具：{len(tools.tools)} 个")
        for tool in tools.tools:
            print(f"  - {tool.name}: {tool.description}")
        
        # 测试获取天气
        print("\n🌤️ 查询北京天气...")
        result = await client.call_tool("get_weather", {"city": "北京"})
        print(f"✅ 结果：{result}")


if __name__ == "__main__":
    asyncio.run(test_weather())
