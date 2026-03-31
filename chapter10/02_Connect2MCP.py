import asyncio
from protocols import MCPClient

async def connect_to_server():
    # 方式 1：连接到 HTTP MCP 服务器
    # 需要先启动服务器：python http_server.py
    client = MCPClient("http://localhost:8080/mcp")

    # 使用 async with 确保连接正确关闭
    async with client:
        # 在这里使用 client
        tools = await client.list_tools()
        print(f"可用工具：{[t['name'] for t in tools]}")

async def discover_tools():
    client = MCPClient("http://localhost:8080/mcp")

    async with client:
        # 获取所有可用工具
        tools = await client.list_tools()

        print(f"服务器提供了 {len(tools)} 个工具：")
        for tool in tools:
            print(f"\n工具名称：{tool['name']}")
            print(f"描述：{tool.get('description', '无描述')}")

            # 打印参数信息
            if 'input_schema' in tool:
                schema = tool['input_schema']
                if 'properties' in schema:
                    print("参数:")
                    for param_name, param_info in schema['properties'].items():
                        param_type = param_info.get('type', 'any')
                        param_desc = param_info.get('description', '')
                        print(f"  - {param_name} ({param_type}): {param_desc}")

async def use_tools():
    client = MCPClient("http://localhost:8080/mcp")

    async with client:
        # 调用加法工具
        result = await client.call_tool("add", {"a": 10, "b": 20})
        print(f"计算结果：{result}")

        # 调用问候工具
        result = await client.call_tool("greet", {"name": "MCP"})
        print(f"问候结果：{result}")

        # 列出目录
        result = await client.call_tool("list_directory", {"path": "."})
        print(f"当前目录文件：{result}")

async def safe_tool_call():
    client = MCPClient("http://localhost:8080/mcp")

    async with client:
        try:
            # 尝试访问可能不存在的目录
            result = await client.call_tool("list_directory", {"path": "nonexistent"})
            print(result)
        except Exception as e:
            print(f"工具调用失败：{e}")
            # 可以选择重试、使用默认值或向用户报告错误

# 运行示例
if __name__ == "__main__":
    print("=" * 60)
    print("MCP 客户端示例 - HTTP 传输")
    print("=" * 60)
    print("\n提示：运行前请先启动服务器：python http_server.py\n")
    
    print("【示例 1】连接到服务器...")
    asyncio.run(connect_to_server())
    
    print("\n【示例 2】发现工具...")
    asyncio.run(discover_tools())
    
    print("\n【示例 3】使用工具...")
    asyncio.run(use_tools())
    
    print("\n【示例 4】安全调用...")
    asyncio.run(safe_tool_call())
    
    print("\n✅ 所有示例完成！")
