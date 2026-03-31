"""
代码审查工作流

流程：
1. 用户提出需求
2. Coder Agent 编写代码
3. Reviewer Agent 审查代码
4. 如果有问题 → Coder 修改
5. 审查通过 → 输出最终代码
"""

from typing import List, Dict
from agents.coder_agent import CoderAgent
from agents.reviewer_agent import ReviewerAgent


class CodeReviewWorkflow:
    """代码审查工作流"""
    
    def __init__(self, agents: List):
        """
        初始化工作流
        
        Args:
            agents: Agent 列表 [coder, reviewer, ...]
        """
        self.coder = agents[0] if len(agents) > 0 else None
        self.reviewer = agents[1] if len(agents) > 1 else None
        
        if not self.coder or not self.reviewer:
            raise ValueError("代码审查工作流至少需要 Coder 和 Reviewer 两个 Agent")
        
        self.max_iterations = 3  # 最大修改次数
        self.current_iteration = 0
    
    async def run_async(self, requirement: str = None):
        """
        运行代码审查工作流（异步版本）
        
        Args:
            requirement: 代码需求（可选，如果没有则从用户输入读取）
        """
        if not requirement:
            requirement = input("请输入代码需求：")
        
        print(f"\n🚀 开始代码审查流程")
        print(f"需求：{requirement}\n")
        
        # 第 1 步：Coder 编写代码
        print("📝 Step 1: Coder 编写代码...")
        code = await self.coder.write_code_async(requirement)
        print(f"✓ Coder 完成代码编写\n")
        
        # 第 2 步：Reviewer 审查
        while self.current_iteration < self.max_iterations:
            self.current_iteration += 1
            
            print(f"🔍 Step 2: Reviewer 审查 (第 {self.current_iteration} 轮)...")
            review_result = await self.reviewer.review_code_async(code, requirement)
            print(f"✓ Reviewer 完成审查\n")
            print(f"审查结果:\n{review_result['review']}\n")
            
            # 第 3 步：判断是否通过
            if review_result['passed']:
                print("✅ 审查通过！\n")
                break
            else:
                print(f"⚠️  审查未通过，需要修改\n")
                
                # 第 4 步：Coder 修改
                print("🔧 Step 3: Coder 修改代码...")
                code = await self.coder.review_and_fix_async(code, review_result['review'])
                print(f"✓ Coder 完成修改\n")
        
        # 输出最终代码
        print("=" * 60)
        print("🎉 代码审查完成！")
        print("=" * 60)
        print(f"\n最终代码:\n{code}\n")
        
        return {
            'code': code,
            'review': review_result['review'],
            'passed': review_result['passed'],
            'iterations': self.current_iteration
        }
    
    def run(self, requirement: str = None):
        """同步包装器"""
        import asyncio
        return asyncio.run(self.run_async(requirement))
    
    def run_with_examples(self):
        """运行示例代码审查"""
        example_requirement = """
创建一个 Python 函数，用于计算列表中所有数字的平均值。
要求：
1. 处理空列表的情况
2. 处理非数字元素的情况
3. 添加适当的错误处理
4. 添加文档字符串和类型注解
"""
        
        print("📋 运行示例代码审查\n")
        return self.run(example_requirement)
