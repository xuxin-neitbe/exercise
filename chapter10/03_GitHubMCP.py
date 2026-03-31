"""
GitHub MCP 服务示例

注意：需要设置环境变量
    Windows: $env:GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
    Linux/macOS: export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"

使用新的官方 GitHub MCP 服务器（远程 HTTP 方式）：
    - 官方远程服务器：https://api.githubcopilot.com/mcp/
    - 无需 Docker、Go 或 npx，直接连接远程服务器
    - 官方文档：https://github.com/github/github-mcp-server
"""

import asyncio
import os
from dotenv import load_dotenv
from protocols.mcp import MCPClient

# 加载 .env 文件中的环境变量
load_dotenv()


SEARCH_QUERY = "AI agents language:python"
PAGE_NUMBER = 1
PER_PAGE = 3


async def main():
    """主函数：演示 GitHub MCP 服务器使用"""
    
    # 验证 token 是否存在
    github_token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not github_token:
        print("❌ 错误：未找到 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量")
        print("请在 .env 文件中配置 GITHUB_PERSONAL_ACCESS_TOKEN")
        return
    
    # 创建 GitHub MCP 客户端，连接到远程 HTTP 服务器
    # 使用官方远程 GitHub MCP 服务器
    # 文档：https://github.com/github/github-mcp-server
    github_client = MCPClient(
        "https://api.githubcopilot.com/mcp/",
        headers={"Authorization": f"Bearer {github_token}"}
    )
    
    async with github_client:
        print("📋 可用工具：")
        tools = await github_client.list_tools()
        for tool in tools:
            print(f"  - {tool['name']}: {tool['description']}")
        
        print("\n🔍 搜索仓库：")
        result = await github_client.call_tool(
            "search_repositories",
            {
                "query": SEARCH_QUERY,
                "page": PAGE_NUMBER,
                "perPage": PER_PAGE
            }
        )
        print(result)


if __name__ == "__main__":
    asyncio.run(main())

