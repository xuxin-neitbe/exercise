"""
诊断测试脚本 - 用于检查 API 连接和响应
"""
from openai import OpenAI

# 配置
API_KEY = "sk-908dc71a548f48e4a0ed9b0a70b138a0"
BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
MODEL_ID = "qwen-flash"

print("=" * 60)
print("诊断测试：检查 LLM API 连接")
print("=" * 60)

print(f"\n配置信息:")
print(f"  API Key: {API_KEY[:10]}...")
print(f"  Base URL: {BASE_URL}")
print(f"  Model: {MODEL_ID}")

print("\n正在初始化 OpenAI 客户端...")
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
print("✓ 客户端初始化成功")

print("\n正在发送测试请求...")
print("提示词：你好，请回复'测试成功'")

try:
    messages = [
        {'role': 'system', 'content': '你是一个助手。'},
        {'role': 'user', 'content': '你好，请回复"测试成功"'}
    ]
    
    print("正在调用 API...")
    response = client.chat.completions.create(
        model=MODEL_ID,
        messages=messages,
        stream=False,
        timeout=30  # 设置 30 秒超时
    )
    
    print(f"\n✓ API 调用成功!")
    print(f"响应类型：{type(response)}")
    print(f"choices 数量：{len(response.choices)}")
    
    answer = response.choices[0].message.content
    print(f"\n模型回复:\n{answer}")
    
    print("\n" + "=" * 60)
    print("诊断结果：API 连接正常 ✓")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ 错误：{type(e).__name__}: {e}")
    print("\n" + "=" * 60)
    print("诊断结果：API 连接失败 ✗")
    print("=" * 60)
    print("\n可能的原因:")
    print("1. API Key 无效或已过期")
    print("2. Base URL 不正确")
    print("3. 网络连接问题")
    print("4. 模型名称不正确")
    print("5. 账户余额不足")
