"""
Reviewer Agent - 代码审查专家（使用 AutoGen 0.4+ AgentChat API）

职责：
- 审查代码质量和安全性
- 发现潜在问题并提出改进建议
- 确保代码遵循最佳实践

注意：此版本使用 AutoGen 0.4+ 的 AgentChat API
"""

import asyncio
import re
from typing import Dict
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient


class ReviewerAgent:
    """代码审查 Agent（基于 AutoGen 0.4+ AgentChat API）"""
    
    def __init__(self, config: dict):
        """
        初始化 Reviewer Agent
        
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
            name="{{REVIEWER_NAME}}",
            model_client=self.model_client,
            system_message="""你是一个严格的代码审查专家。你负责发现代码中的问题并提出改进建议。

你关注：
- 代码质量和可读性
- 潜在的安全问题
- 性能优化建议
- 测试覆盖率
- 编码规范遵循
- 错误处理
- 资源管理

当你审查代码时，请：
1. 先理解代码的功能
2. 检查代码质量
3. 发现潜在问题
4. 提供具体的改进建议
5. 如果代码优秀，也要给予肯定

请保持建设性的批评态度。""",
            description="一个严格的代码审查专家"
        )
        
        # 存储最后一次的回复
        self._last_response = None
    
    async def review_code_async(self, code: str, requirement: str = "") -> Dict:
        """
        审查代码（异步版本）
        
        Args:
            code: 需要审查的代码
            requirement: 原始需求（可选）
            
        Returns:
            审查结果字典
        """
        prompt = f"""请审查以下代码：

需求描述：{requirement if requirement else '未提供'}

代码：
```python
{code}
```

请从以下方面进行审查：
1. **代码质量**：可读性、命名规范、代码结构
2. **安全性**：潜在的安全漏洞
3. **性能**：性能瓶颈和优化建议
4. **测试**：测试覆盖率和测试建议
5. **改进建议**：具体的改进建议

请按以下格式输出：
## 审查总结
（总体评价）

## 优点
（代码做得好的地方）

## 发现的问题
（按严重程度列出）

## 改进建议
（具体的改进建议）

## 评分
（1-10 分）"""
        
        result = await self.agent.run(task=prompt)
        self._last_response = result
        
        # 提取审查文本
        review_text = ""
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            review_text = final_message.content if hasattr(final_message, 'content') else str(final_message)
        else:
            review_text = str(result)
        
        # 提取评分
        score = self._extract_score(review_text)
        
        return {
            'review': review_text,
            'passed': score >= 7,
            'score': score
        }
    
    def review_code(self, code: str, requirement: str = "") -> Dict:
        """
        审查代码（同步包装器）
        
        Args:
            code: 需要审查的代码
            requirement: 原始需求（可选）
            
        Returns:
            审查结果字典
        """
        return asyncio.run(self.review_code_async(code, requirement))
    
    def _extract_score(self, review_text: str) -> int:
        """从审查文本中提取评分"""
        match = re.search(r'评分 [：:]\s*(\d+)', review_text)
        if match:
            return int(match.group(1))
        return 5  # 默认中等评分
    
    async def suggest_fix_async(self, code: str, issue: str) -> str:
        """
        针对特定问题提供修复建议（异步版本）
        
        Args:
            code: 原始代码
            issue: 发现的问题
            
        Returns:
            修复建议
        """
        prompt = f"""代码中存在以下问题：

{issue}

原始代码：
```python
{code}
```

请提供具体的修复方案和修复后的代码。"""
        
        result = await self.agent.run(task=prompt)
        
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            return final_message.content if hasattr(final_message, 'content') else str(final_message)
        return str(result)
    
    def suggest_fix(self, code: str, issue: str) -> str:
        """
        针对特定问题提供修复建议（同步包装器）
        
        Args:
            code: 原始代码
            issue: 发现的问题
            
        Returns:
            修复建议
        """
        return asyncio.run(self.suggest_fix_async(code, issue))
    
    async def check_security_async(self, code: str) -> Dict:
        """
        安全检查（异步版本）
        
        Args:
            code: 需要检查的代码
            
        Returns:
            安全检查结果
        """
        prompt = f"""请对以下代码进行安全检查：

```python
{code}
```

重点检查：
1. SQL 注入风险
2. XSS 攻击风险
3. 命令注入风险
4. 敏感信息泄露
5. 认证和授权问题
6. 输入验证不足

请列出所有发现的安全问题和修复建议。"""
        
        result = await self.agent.run(task=prompt)
        
        security_review = ""
        if hasattr(result, 'messages') and result.messages:
            final_message = result.messages[-1]
            security_review = final_message.content if hasattr(final_message, 'content') else str(final_message)
        else:
            security_review = str(result)
        
        return {
            'security_review': security_review,
            'safe': '未发现' not in security_review and '风险' not in security_review
        }
    
    def check_security(self, code: str) -> Dict:
        """
        安全检查（同步包装器）
        
        Args:
            code: 需要检查的代码
            
        Returns:
            安全检查结果
        """
        return asyncio.run(self.check_security_async(code))
    
    async def close_async(self):
        """关闭模型客户端（异步）"""
        await self.model_client.close()
    
    def close(self):
        """关闭模型客户端（同步）"""
        asyncio.run(self.close_async())
    
    def get_agent(self) -> AssistantAgent:
        """获取底层的 AssistantAgent 实例"""
        return self.agent
