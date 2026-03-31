from dotenv import load_dotenv
from my_llm import MyLLM

# 加载环境变量
load_dotenv()

# 实例化我们重写的客户端，并指定 provider
llm = MyLLM(provider="dashscope")

# 准备消息
messages = [{"role": "user", "content": "你好，请介绍一下你自己。"}]
# 发起调用，think 等方法都已从父类继承，无需重写
response_stream = llm.think(messages)
# 打印响应
print("ModelScope Response:")
for chunk in response_stream:
    # chunk 在 my_llm 库中已经打印过一遍，这里只需要 pass 即可
    # print(chunk, end="", flush=True)
    pass
