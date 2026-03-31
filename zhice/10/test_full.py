"""
计算器技能 - 完整测试套件
测试所有题目要求和 Skills 规范
"""

import os
import sys
from pathlib import Path

# 先加载环境变量（使用绝对路径）
try:
    from dotenv import load_dotenv
    
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from skills.calculator.scripts.calculator_impl import calculate, get_tool_schema

def test_calculator_skill():
    """测试计算器技能核心功能"""
    print("=" * 60)
    print("计算器技能 - 功能测试")
    print("=" * 60)
    
    test_cases = [
        # 题目要求：4 种基础算术运算
        ("加法", "add", 5, 3, 8, True),
        ("加法 (负数)", "add", -5, 3, -2, True),
        ("加法 (浮点)", "add", 5.5, 3.2, 8.7, True),
        
        ("减法", "subtract", 10, 4, 6, True),
        ("减法 (负数)", "subtract", -10, 4, -14, True),
        ("减法 (浮点)", "subtract", 10.5, 4.2, 6.3, True),
        
        ("乘法", "multiply", 6, 7, 42, True),
        ("乘法 (负数)", "multiply", -6, 7, -42, True),
        ("乘法 (浮点)", "multiply", 6.5, 4.0, 26.0, True),
        
        # 题目要求：除法特殊处理
        ("除法 (浮点)", "divide", 5, 2, 2.5, True),  # 题目要求：5/2=2.5
        ("除法 (整除)", "divide", 10, 2, 5.0, True),
        ("除法 (浮点操作数)", "divide", 7.5, 2.5, 3.0, True),
        
        # 题目要求：除数为 0 时提示错误
        ("除法 (除零错误)", "divide", 10, 0, None, False),
        ("除法 (负数除零)", "divide", -10, 0, None, False),
    ]
    
    passed = 0
    failed = 0
    
    for name, operation, a, b, expected, should_succeed in test_cases:
        result = calculate(operation, a, b)
        
        if should_succeed:
            if "error" in result:
                print(f"❌ {name}: 失败 - 返回错误：{result['error']}")
                failed += 1
            elif abs(result["result"] - expected) < 0.0001:
                print(f"✅ {name}: 通过 - {a} {operation} {b} = {result['result']}")
                passed += 1
            else:
                print(f"❌ {name}: 失败 - 期望 {expected}, 得到 {result['result']}")
                failed += 1
        else:
            # 应该返回错误
            if "error" in result:
                print(f"✅ {name}: 通过 - 正确返回错误：{result['error']}")
                passed += 1
            else:
                print(f"❌ {name}: 失败 - 应该返回错误但得到 {result}")
                failed += 1
    
    print("\n" + "=" * 60)
    print(f"测试结果：{passed} 通过，{failed} 失败")
    print("=" * 60)
    
    return failed == 0


def test_skill_schema():
    """测试 Skills 规范符合性"""
    print("\n" + "=" * 60)
    print("Skills 规范 - 模式检查")
    print("=" * 60)
    
    schema = get_tool_schema()
    
    # 检查基本结构
    checks = [
        ("type 字段", "type" in schema and schema["type"] == "function"),
        ("function 字段", "function" in schema),
        ("name 字段", "function" in schema and "name" in schema["function"]),
        ("description 字段", "function" in schema and "description" in schema["function"]),
        ("parameters 字段", "function" in schema and "parameters" in schema["function"]),
    ]
    
    # 检查参数
    if "function" in schema and "parameters" in schema["function"]:
        params = schema["function"]["parameters"]
        checks.extend([
            ("parameters.type", params.get("type") == "object"),
            ("properties 字段", "properties" in params),
            ("operation 参数", "operation" in params.get("properties", {})),
            ("a 参数", "a" in params.get("properties", {})),
            ("b 参数", "b" in params.get("properties", {})),
            ("required 字段", "required" in params),
        ])
        
        # 检查 operation 枚举
        if "properties" in params and "operation" in params["properties"]:
            op = params["properties"]["operation"]
            checks.extend([
                ("operation 类型", op.get("type") == "string"),
                ("operation 枚举", "enum" in op),
                ("operation 包含 add", "add" in op.get("enum", [])),
                ("operation 包含 subtract", "subtract" in op.get("enum", [])),
                ("operation 包含 multiply", "multiply" in op.get("enum", [])),
                ("operation 包含 divide", "divide" in op.get("enum", [])),
            ])
        
        # 检查 required
        if "required" in params:
            required = params["required"]
            checks.extend([
                ("required 包含 operation", "operation" in required),
                ("required 包含 a", "a" in required),
                ("required 包含 b", "b" in required),
            ])
    
    passed = 0
    failed = 0
    
    for name, result in checks:
        if result:
            print(f"✅ {name}")
            passed += 1
        else:
            print(f"❌ {name}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"规范检查：{passed} 通过，{failed} 失败")
    print("=" * 60)
    
    return failed == 0


def test_llm_integration():
    """测试 LLM Function Calling 集成"""
    print("\n" + "=" * 60)
    print("LLM Function Calling - 集成测试")
    print("=" * 60)
    
    try:
        from agent import CalculatorAgent
        
        agent = CalculatorAgent(
            model_id="tongyi-xiaomi-analysis-pro",
            api_key=os.getenv("DASHSCOPE_API_KEY", "sk-262499770a2d4ca9a4217c46d69504c8"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout=60
        )
        
        test_queries = [
            ("5 加 3", "加法"),
            ("10 减去 4", "减法"),
            ("6 乘以 7", "乘法"),
            ("5 除以 2", "除法 (浮点)"),
            ("10 除以 0", "除法 (除零)"),
            ("7.5 / 2.5", "除法 (浮点操作数)"),
        ]
        
        passed = 0
        failed = 0
        
        for query, test_name in test_queries:
            print(f"\n测试：{test_name}")
            print(f"问题：{query}")
            
            result = agent.process_query(query)
            print(f"回答：{result}")
            
            # 简单验证
            if "错误" in result or "error" in result.lower():
                if "除零" in query or "0" in query:
                    print(f"✅ 正确识别除零错误")
                    passed += 1
                else:
                    print(f"❌ 不应该返回错误")
                    failed += 1
            else:
                if "除零" not in query:
                    print(f"✅ 计算成功")
                    passed += 1
                else:
                    print(f"❌ 应该返回除零错误")
                    failed += 1
            
            agent.clear_history()
        
        print("\n" + "=" * 60)
        print(f"集成测试：{passed} 通过，{failed} 失败")
        print("=" * 60)
        
        return failed == 0
        
    except Exception as e:
        print(f"❌ 集成测试失败：{e}")
        return False


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("计算器技能 - 完整测试套件")
    print("题目：通过 Skills 规范实现简单计算器")
    print("=" * 60 + "\n")
    
    # 测试 1: 核心功能
    skill_passed = test_calculator_skill()
    
    # 测试 2: Skills 规范
    schema_passed = test_skill_schema()
    
    # 测试 3: LLM 集成
    integration_passed = test_llm_integration()
    
    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"核心功能测试：{'✅ 通过' if skill_passed else '❌ 失败'}")
    print(f"Skills 规范检查：{'✅ 通过' if schema_passed else '❌ 失败'}")
    print(f"LLM 集成测试：{'✅ 通过' if integration_passed else '❌ 失败'}")
    print("=" * 60)
    
    all_passed = skill_passed and schema_passed and integration_passed
    
    if all_passed:
        print("\n🎉 所有测试通过！代码符合题目和 Skills 规范要求。")
    else:
        print("\n⚠️ 部分测试失败，请检查代码。")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
