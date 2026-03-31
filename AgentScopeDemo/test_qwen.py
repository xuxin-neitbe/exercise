"""
测试通义千问 Qwen-Plus 模型配置
"""

from openai import OpenAI
import os

# 配置阿里云 DashScope API
client = OpenAI(
    api_key="sk-262499770a2d4ca9a4217c46d69504c8",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

def test_model():
    """测试 Qwen-Plus 模型"""
    print("🚀 开始测试通义千问 Qwen-Plus 模型...")
    print("=" * 60)
    
    try:
        # 测试 1：基础对话
        print("\n📝 测试 1：基础对话能力")
        print("-" * 60)
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": "你是一个有帮助的助手。"},
                {"role": "user", "content": "请用一句话介绍你自己。"}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        print(f"✅ API 连接成功！")
        print(f"📤 请求 ID: {response.id}")
        print(f"📊 使用情况:")
        print(f"   - 提示词 tokens: {response.usage.prompt_tokens}")
        print(f"   - 完成 tokens: {response.usage.completion_tokens}")
        print(f"   - 总计 tokens: {response.usage.total_tokens}")
        print(f"\n💬 模型回复:")
        print(f"   {response.choices[0].message.content}")
        
        # 测试 2：代码生成
        print("\n\n📝 测试 2：代码生成能力")
        print("-" * 60)
        response2 = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "user", "content": "用 Python 写一个计算斐波那契数列的函数，只需要代码，不需要解释。"}
            ],
            temperature=0.3,
            max_tokens=300
        )
        
        print(f"💬 生成的代码:")
        print(f"   {response2.choices[0].message.content}")
        
        # 测试 3：逻辑推理
        print("\n\n📝 测试 3：逻辑推理能力")
        print("-" * 60)
        response3 = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "user", "content": "如果所有的猫都喜欢吃鱼，而 Tom 是一只猫，那么 Tom 喜欢吃什么？请简单推理。"}
            ],
            temperature=0.5,
            max_tokens=200
        )
        
        print(f"💬 推理结果:")
        print(f"   {response3.choices[0].message.content}")
        
        print("\n" + "=" * 60)
        print("✅ 所有测试完成！Qwen-Plus 模型运行正常。")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 测试失败：{str(e)}")
        print("\n请检查:")
        print("  1. API Key 是否正确")
        print("  2. 网络连接是否正常")
        print("  3. API 端点 URL 是否正确")
        raise

if __name__ == "__main__":
    test_model()
