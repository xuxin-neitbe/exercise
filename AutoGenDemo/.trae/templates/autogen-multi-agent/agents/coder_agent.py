"""
Coder Agent - 代码编写专家（使用 AutoGen 0.4+ AgentChat API）

职责：
- 根据需求编写高质量代码
- 遵循最佳实践和编码规范
- 编写清晰、有注释的代码

注意：此版本使用 AutoGen 0.4+ 的 AgentChat API
"""

import asyncio
from typing import Optional
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient


class CoderAgent:
    """代码编写 Agent（基于 AutoGen 0.4+ AgentChat API）"""
    
    def __init__(self, config: dict):
        """
        初始化 Coder Agent
        
        Args:
            config: LLM 配置字典，包含 model、api_key 等
        """
        self.config = config
        
        # 创建 OpenAI 客户端（AutoGen 0.4+）
        self.model_client = OpenAIChatCompletionClient(
            model=config.get('model', 'gpt-4'),
            api_key=config.get('api_key', ''),
            base_url=config.get('base_url', None)
        )
        
        # 创建 Assistant Agent（AutoGen 0.4+ AgentChat API）
        self.agent = AssistantAgent(
            name="{{CODER_NAME}}",
            model_client=self.model_client,
            system_message="""你是一个专业的 Python 开发者。你负责编写高质量、可维护的代码。

你擅长：
- 理解需求并转化为代码
- 编写清晰、有注释的代码
- 遵循最佳实践和编码规范
- 编写测试用例
- 调试和修复问题

当你收到编码任务时，请：
1. 先理解需求
2. 设计解决方案
3. 编写代码
4. 添加必要的注释
5. 提供使用说明""",
            description="一个专业的代码编写助手"
        )
        
        # 存储最后一次的回复
        self._last_response = None
    
    async def write_code_async(self, requirement: str) -> str:
        """
        根据需求编写代码（异步版本）
        
        Args:
            requirement: 代码需求描述
            
        Returns:
            生成的代码
        """
        result = await self.agent.run(task=requirement)
        self._last_response = result
        
        # 提取最终消息
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            return final_message.content if hasattr(final_message, 'content') else str(final_message)
        return str(result)
    
    def write_code(self, requirement: str) -> str:
        """
        根据需求编写代码（同步包装器）
        
        Args:
            requirement: 代码需求描述
            
        Returns:
            生成的代码
        """
        return asyncio.run(self.write_code_async(requirement))
    
    async def review_and_fix_async(self, code: str, feedback: str) -> str:
        """
        根据反馈修复代码（异步版本）
        
        Args:
            code: 原始代码
            feedback: 审查反馈
            
        Returns:
            修复后的代码
        """
        prompt = f"""请根据以下反馈修复代码：

原始代码：
```python
{code}
```

审查反馈：
{feedback}

请提供修复后的完整代码。"""
        
        result = await self.agent.run(task=prompt)
        self._last_response = result
        
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            return final_message.content if hasattr(final_message, 'content') else str(final_message)
        return str(result)
    
    def review_and_fix(self, code: str, feedback: str) -> str:
        """
        根据反馈修复代码（同步包装器）
        
        Args:
            code: 原始代码
            feedback: 审查反馈
            
        Returns:
            修复后的代码
        """
        return asyncio.run(self.review_and_fix_async(code, feedback))
    
    async def explain_code_async(self, code: str) -> str:
        """
        解释代码功能（异步版本）
        
        Args:
            code: 需要解释的代码
            
        Returns:
            代码解释
        """
        prompt = f"""请详细解释以下代码的功能和实现思路：

```python
{code}
```

请说明：
1. 代码的主要功能
2. 关键实现思路
3. 使用了哪些技术或库
4. 可能的优化空间"""
        
        result = await self.agent.run(task=prompt)
        
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            return final_message.content if hasattr(final_message, 'content') else str(final_message)
        return str(result)
    
    def explain_code(self, code: str) -> str:
        """
        解释代码功能（同步包装器）
        
        Args:
            code: 需要解释的代码
            
        Returns:
            代码解释
        """
        return asyncio.run(self.explain_code_async(code))
    
    async def close_async(self):
        """关闭模型客户端（异步）"""
        await self.model_client.close()
    
    def close(self):
        """关闭模型客户端（同步）"""
        asyncio.run(self.close_async())
    
    def get_agent(self) -> AssistantAgent:
        """获取底层的 AssistantAgent 实例"""
        return self.agent
