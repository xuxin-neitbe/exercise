"""
结对编程工作流

流程：
1. 用户提出需求
2. Coder 编写代码
3. Reviewer 实时提供建议
4. Coder 根据建议调整
5. 协作完成功能
"""

from typing import List
from agents.coder_agent import CoderAgent
from agents.reviewer_agent import ReviewerAgent


class PairProgrammingWorkflow:
    """结对编程工作流"""
    
    def __init__(self, agents: List):
        """
        初始化工作流
        
        Args:
            agents: Agent 列表 [coder, reviewer, ...]
        """
        self.coder = agents[0] if len(agents) > 0 else None
        self.reviewer = agents[1] if len(agents) > 1 else None
        
        if not self.coder or not self.reviewer:
            raise ValueError("结对编程工作流至少需要 Coder 和 Reviewer 两个 Agent")
    
    async def run_async(self, requirement: str = None):
        """
        运行结对编程工作流（异步版本）
        
        Args:
            requirement: 代码需求（可选，如果没有则从用户输入读取）
        """
        if not requirement:
            requirement = input("请输入代码需求：")
        
        print(f"\n🚀 开始结对编程流程")
        print(f"需求：{requirement}\n")
        
        # 第 1 步：Coder 编写初始代码
        print("📝 Step 1: Coder 编写初始代码...")
        code = await self.coder.write_code_async(requirement)
        print(f"✓ Coder 完成初始代码\n")
        
        # 第 2 步：Reviewer 提供实时建议
        print("💡 Step 2: Reviewer 提供实时建议...")
        suggestions = await self._get_suggestions_async(code, requirement)
        print(f"✓ Reviewer 提供建议\n")
        
        # 第 3 步：Coder 根据建议调整
        print("🔧 Step 3: Coder 根据建议调整代码...")
        improved_code = await self.coder.review_and_fix_async(code, suggestions)
        print(f"✓ Coder 完成调整\n")
        
        # 第 4 步：最终审查
        print("✅ Step 4: 最终审查...")
        final_review = await self.reviewer.review_code_async(improved_code, requirement)
        print(f"最终审查结果:\n{final_review['review']}\n")
        
        # 输出最终代码
        print("=" * 60)
        print("🎉 结对编程完成！")
        print("=" * 60)
        print(f"\n最终代码:\n{improved_code}\n")
        
        return {
            'initial_code': code,
            'suggestions': suggestions,
            'final_code': improved_code,
            'final_review': final_review['review']
        }
    
    def run(self, requirement: str = None):
        """同步包装器"""
        import asyncio
        return asyncio.run(self.run_async(requirement))
    
    async def _get_suggestions_async(self, code: str, requirement: str) -> str:
        """获取 Reviewer 的实时建议（异步版本）"""
        prompt = f"""你是一个结对编程的伙伴。请对以下代码提供实时建议：

需求：{requirement}

当前代码：
```python
{code}
```

请从以下方面提供建议（不需要完整的代码审查）：
1. 代码改进建议（1-2 个最重要的点）
2. 可能的优化方向
3. 需要注意的地方

保持建议简洁、实用，就像坐在程序员旁边实时交流一样。"""
        
        # 使用 Reviewer Agent 的 run 方法
        result = await self.reviewer.agent.run(task=prompt)
        # 从结果中提取消息
        if hasattr(result, 'messages') and len(result.messages) > 0:
            suggestions = result.messages[-1].content
        else:
            suggestions = str(result)
        
        return suggestions
    
    def _get_suggestions(self, code: str, requirement: str) -> str:
        """同步包装器"""
        import asyncio
        return asyncio.run(self._get_suggestions_async(code, requirement))
    
    def run_interactive(self):
        """运行交互式结对编程"""
        print("🤝 进入交互式结对编程模式\n")
        print("你可以随时输入：")
        print("  - 'quit' 退出")
        print("  - 'show' 显示当前代码")
        print("  - 'explain' 解释代码\n")
        
        current_code = ""
        
        while True:
            user_input = input("\n请输入需求或指令：")
            
            if user_input.lower() == 'quit':
                print("👋 结束结对编程")
                break
            elif user_input.lower() == 'show':
                print(f"\n当前代码:\n{current_code}\n")
            elif user_input.lower() == 'explain':
                explanation = self.coder.explain_code(current_code)
                print(f"\n代码解释:\n{explanation}\n")
            else:
                # 处理需求
                if current_code:
                    print("🔧 Coder 根据新需求调整代码...")
                    current_code = self.coder.review_and_fix(current_code, user_input)
                else:
                    print("📝 Coder 编写代码...")
                    current_code = self.coder.write_code(user_input)
                
                print("✓ 代码已更新\n")
                
                # Reviewer 提供建议
                print("💡 Reviewer 建议...")
                suggestions = self._get_suggestions(current_code, user_input)
                print(f"{suggestions}\n")
