"""Agent 实现模块 - HelloAgents 原生 Agent 范式"""

__all__ = [
    "SimpleAgent",
    "FunctionCallAgent",
    "ReActAgent",
    "ReflectionAgent",
    "PlanAndSolveAgent",
    "ToolAwareSimpleAgent"
]


def __getattr__(name):
    """延迟导入，避免导入时的相对导入问题"""
    if name == "SimpleAgent":
        from .simple_agent import SimpleAgent
        return SimpleAgent
    elif name == "FunctionCallAgent":
        from .function_call_agent import FunctionCallAgent
        return FunctionCallAgent
    elif name == "ReActAgent":
        from .react_agent import ReActAgent
        return ReActAgent
    elif name == "ReflectionAgent":
        from .reflection_agent import ReflectionAgent
        return ReflectionAgent
    elif name == "PlanAndSolveAgent":
        from .plan_solve_agent import PlanAndSolveAgent
        return PlanAndSolveAgent
    elif name == "ToolAwareSimpleAgent":
        from .tool_aware_agent import ToolAwareSimpleAgent
        return ToolAwareSimpleAgent
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
