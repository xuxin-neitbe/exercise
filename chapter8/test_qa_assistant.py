#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试 QA_Assistant 的核心功能"""

from dotenv import load_dotenv
load_dotenv()

from tools.builtin.memory_tool import MemoryTool
from tools.builtin.rag_tool import RAGTool

print("="*60)
print("测试 QA_Assistant 核心功能")
print("="*60)

# 测试 MemoryTool
print("\n1. 测试 MemoryTool...")
try:
    memory_tool = MemoryTool(user_id="test_user")
    print("✅ MemoryTool 初始化成功")
    
    # 测试添加记忆
    result = memory_tool.run({
        "action": "add",
        "content": "这是一条测试记忆",
        "memory_type": "working",
        "importance": 0.5
    })
    print(f"✅ 添加记忆成功：{result}")
    
except Exception as e:
    print(f"❌ MemoryTool 测试失败：{e}")

# 测试 RAGTool
print("\n2. 测试 RAGTool...")
try:
    rag_tool = RAGTool(rag_namespace="test")
    print("✅ RAGTool 初始化成功")
    
    # 测试获取统计
    result = rag_tool.run({
        "action": "stats"
    })
    print(f"✅ RAG 统计：{result}")
    
except Exception as e:
    print(f"❌ RAGTool 测试失败：{e}")

print("\n" + "="*60)
print("测试完成！")
print("="*60)
