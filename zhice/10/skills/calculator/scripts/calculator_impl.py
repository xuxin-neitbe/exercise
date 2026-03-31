"""
计算器技能 - 参考实现

本模块提供了遵循 LLM 函数调用规范的计算器技能参考实现。
"""

from typing import Union, Dict, Any


def execute(operation: str, a: Union[int, float], b: Union[int, float]) -> Dict[str, Any]:
    """
    执行基本算术运算。
    
    参数:
        operation: 算术运算类型 ('add', 'subtract', 'multiply', 'divide')
        a: 第一个操作数
        b: 第二个操作数
    
    返回:
        包含运算详情和结果的字典，
        如果尝试除以零则返回错误消息。
    
    异常:
        ValueError: 如果提供了无效的运算类型
    """
    valid_operations = ["add", "subtract", "multiply", "divide"]
    
    if operation not in valid_operations:
        raise ValueError(f"无效的运算类型：{operation}。必须是 {valid_operations} 之一")
    
    if operation == "add":
        result = a + b
    elif operation == "subtract":
        result = a - b
    elif operation == "multiply":
        result = a * b
    elif operation == "divide":
        if b == 0:
            return {
                "error": "不允许除以零",
                "operation": operation,
                "a": a,
                "b": b
            }
        result = a / b
    
    return {
        "operation": operation,
        "a": a,
        "b": b,
        "result": result
    }


def get_tool_schema() -> Dict[str, Any]:
    """
    返回用于 LLM 函数调用的函数模式。
    
    返回:
        包含 OpenAI 兼容函数模式的字典。
    """
    return {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "执行基本算术运算：加法、减法、乘法和除法。除以零时返回错误消息。",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["add", "subtract", "multiply", "divide"],
                        "description": "要执行的算术运算"
                    },
                    "a": {
                        "type": "number",
                        "description": "第一个操作数"
                    },
                    "b": {
                        "type": "number",
                        "description": "第二个操作数"
                    }
                },
                "required": ["operation", "a", "b"]
            }
        }
    }


def get_skill_info() -> Dict[str, Any]:
    """
    返回技能的完整信息（通用接口）。
    
    返回:
        包含技能名称、执行函数和 schema 的字典。
    """
    return {
        "name": "calculate",
        "function": execute,
        "schema": get_tool_schema()
    }


if __name__ == "__main__":
    print("计算器技能 - 测试用例\n")
    
    test_cases = [
        ("add", 5, 3),
        ("subtract", 10, 4),
        ("multiply", 6, 7),
        ("divide", 5, 2),
        ("divide", 10, 0),
        ("divide", 7.5, 2.5),
        ("add", -5, 3),
    ]
    
    for op, a, b in test_cases:
        result = execute(op, a, b)
        print(f"{op}({a}, {b}) = {result}")
