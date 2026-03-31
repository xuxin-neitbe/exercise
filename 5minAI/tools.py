import requests
import os
from tavily import TavilyClient
import inspect

# 调试模式标志
DEBUG = True


def debug_log(module: str, message: str):
    """打印调试日志，带文件名和行号"""
    if DEBUG:
        # 获取调用者的文件名和行号
        frame = inspect.currentframe().f_back
        filename = os.path.basename(frame.f_code.co_filename)
        lineno = frame.f_lineno
        print(f"[DEBUG][{module}][{filename}:{lineno}] {message}")


def get_weather(city: str) -> str:
    """
    通过阿里云天气 API 查询真实的天气信息。
    
    参数:
        city (str): 城市名称
        
    返回:
        str: 格式化的天气信息，如"北京当前天气：晴，气温 25 摄氏度"
        或错误信息
        
    API 说明:
        - 阿里云市场免费天气 API
        - 需要先购买免费套餐
        - 文档：https://market.aliyun.com/products/57126001/cmapi026602.html
        - 请求方式：POST
        - API 地址：https://kztq.market.alicloudapi.com/api/weather/now
    """
    debug_log("get_weather", f"========== 开始执行 get_weather ==========")
    debug_log("get_weather", f"输入参数：city='{city}'")
    
    # 阿里云天气 API 配置
    # 需要先购买免费套餐：https://market.aliyun.com/products/57126001/cmapi026602.html
    APPCODE = os.environ.get("ALIYUN_WEATHER_APCODE")
    
    if not APPCODE:
        debug_log("get_weather", "⚠️ 未配置 ALIYUN_WEATHER_APCODE，使用模拟数据")
        debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
        return f"{city}当前天气：晴，气温 25 摄氏度（模拟数据）"
    
    # API 端点
    host = 'https://kztq.market.alicloudapi.com'
    path = '/api/weather/real/time'
    url = host + path
    
    # 请求头
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Authorization': 'APPCODE ' + APPCODE
    }
    
    # 请求体 - 根据 API 文档，使用 city 参数
    bodys = {
        'city': city  # 城市名称
    }
    
    debug_log("get_weather", f"请求 URL: {url}")
    debug_log("get_weather", f"请求参数：{bodys}")
    
    try:
        # 发起 POST 请求（添加超时设置）
        debug_log("get_weather", "正在发起 HTTP POST 请求...")
        response = requests.post(url, data=bodys, headers=headers, timeout=10)
        debug_log("get_weather", f"收到响应，状态码：{response.status_code}")
        
        # 检查响应状态码
        debug_log("get_weather", "正在检查响应状态码...")
        response.raise_for_status()
        debug_log("get_weather", "状态码检查通过")
        
        # 解析返回的 JSON 数据
        debug_log("get_weather", "正在解析 JSON 数据...")
        data = response.json()
        debug_log("get_weather", f"JSON 解析成功，数据结构：{type(data)}")
        debug_log("get_weather", f"完整响应：{data}")
        
        # 检查返回码
        if data.get("code") != 200:
            debug_log("get_weather", f"⚠️ API 返回错误：code={data.get('code')}, msg={data.get('msg', '未知错误')}")
            debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
            return f"{city}当前天气：晴，气温 25 摄氏度（模拟数据）"
        
        # 提取天气信息
        debug_log("get_weather", "正在提取天气数据...")
        # API 返回的数据结构：data -> data -> 实际天气数据
        result_data = data.get("data", {}).get("data", {})
        
        if not result_data:
            debug_log("get_weather", "⚠️ 未找到天气数据")
            debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
            return f"{city}当前天气：晴，气温 25 摄氏度（模拟数据）"
        
        # 提取具体字段
        weather_desc = result_data.get("wea", "未知")  # 天气状况
        temp_c = result_data.get("tem", "未知")  # 当前温度
        
        debug_log("get_weather", f"提取结果：weather_desc='{weather_desc}', temp_c='{temp_c}'")
        
        # 格式化成自然语言返回
        result = f"{city}当前天气:{weather_desc}，气温{temp_c}摄氏度"
        debug_log("get_weather", f"格式化结果：{result}")
        debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
        return result
        
    except requests.exceptions.Timeout:
        # 超时错误
        debug_log("get_weather", "❌ 请求超时（超过 10 秒）")
        debug_log("get_weather", "⚠️ 使用模拟数据（学习模式）")
        debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
        return f"{city}当前天气：晴，气温 25 摄氏度（模拟数据）"
        
    except requests.exceptions.RequestException as e:
        # 处理网络错误
        debug_log("get_weather", f"❌ 网络错误：{e}")
        debug_log("get_weather", "⚠️ 使用模拟数据（学习模式）")
        debug_log("get_weather", f"========== get_weather 执行完成 ==========\n")
        return f"{city}当前天气：晴，气温 25 摄氏度（模拟数据）"
        
    except (KeyError, IndexError) as e:
        # 处理数据解析错误
        debug_log("get_weather", f"❌ 数据解析错误：{e}")
        debug_log("get_weather", f"========== get_weather 执行失败 ==========\n")
        return f"错误：解析天气数据失败，可能是城市名称无效 - {e}"


def get_attraction(city: str, weather: str) -> str:
    """
    根据城市和天气，使用 Tavily Search API 搜索并返回优化后的景点推荐。
    
    参数:
        city (str): 城市名称
        weather (str): 天气状况（如"晴"、"雨"、"多云"等）
        
    返回:
        str: AI 生成的景点推荐总结或格式化的搜索结果
        或错误信息
    """
    debug_log("get_attraction", f"========== 开始执行 get_attraction ==========")
    debug_log("get_attraction", f"输入参数：city='{city}', weather='{weather}'")
    
    # 1. 从环境变量中读取 API 密钥
    debug_log("get_attraction", "步骤 1: 正在从环境变量读取 TAVILY_API_KEY...")
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        debug_log("get_attraction", "❌ TAVILY_API_KEY 未配置")
        debug_log("get_attraction", "⚠️ 使用模拟数据（学习模式）")
        debug_log("get_attraction", f"========== get_attraction 执行完成 ==========\n")
        return f"根据{city}{weather}朗天气，推荐景点：\n1. 颐和园 - 晴天湖光山色最美\n2. 故宫 - 光线好适合拍照\n3. 天坛公园 - 视野开阔（模拟数据）"
    
    debug_log("get_attraction", f"✓ API Key 读取成功：{api_key[:10]}...")  # 只显示前 10 个字符
    
    # 2. 初始化 Tavily 客户端
    debug_log("get_attraction", "步骤 2: 正在初始化 Tavily 客户端...")
    tavily = TavilyClient(api_key=api_key)
    debug_log("get_attraction", "✓ Tavily 客户端初始化成功")
    
    # 3. 构造一个精确的查询
    query = f"'{city}' 在'{weather}'天气下最值得去的旅游景点推荐及理由"
    debug_log("get_attraction", f"步骤 3: 构造查询语句：{query}")
    
    try:
        # 4. 调用 API，include_answer=True 会返回一个综合性的回答
        debug_log("get_attraction", "步骤 4: 正在调用 Tavily Search API...")
        debug_log("get_attraction", "参数：search_depth='basic', include_answer=True")
        response = tavily.search(query=query, search_depth="basic", include_answer=True)
        debug_log("get_attraction", f"✓ API 调用成功，响应类型：{type(response)}")
        debug_log("get_attraction", f"响应包含的键：{list(response.keys())}")
        
        # 5. Tavily 返回的结果已经非常干净，可以直接使用
        # response['answer'] 是一个基于所有搜索结果的总结性回答
        debug_log("get_attraction", "步骤 5: 正在处理响应数据...")
        if response.get("answer"):
            debug_log("get_attraction", "✓ 找到 AI 总结答案 (answer 字段)")
            result = response["answer"]
            debug_log("get_attraction", f"答案预览：{result[:100]}...")
            debug_log("get_attraction", f"========== get_attraction 执行完成 ==========\n")
            return result
        
        # 如果没有综合性回答，则格式化原始结果
        debug_log("get_attraction", "未找到 AI 总结答案，正在格式化原始搜索结果...")
        formatted_results = []
        for result in response.get("results", []):
            formatted_results.append(f"- {result['title']}: {result['content']}")
        
        if not formatted_results:
            debug_log("get_attraction", "⚠️ 未找到任何搜索结果")
            debug_log("get_attraction", f"========== get_attraction 执行完成 ==========\n")
            return "抱歉，没有找到相关的旅游景点推荐。"
        
        debug_log("get_attraction", f"✓ 格式化完成，共 {len(formatted_results)} 条结果")
        result = "根据搜索，为您找到以下信息:\n" + "\n".join(formatted_results)
        debug_log("get_attraction", f"========== get_attraction 执行完成 ==========\n")
        return result
        
    except Exception as e:
        # 捕获异常
        debug_log("get_attraction", f"❌ 执行异常：{type(e).__name__}: {e}")
        debug_log("get_attraction", "⚠️ 使用模拟数据（学习模式）")
        debug_log("get_attraction", f"========== get_attraction 执行完成 ==========\n")
        return f"根据{city}{weather}朗天气，推荐景点：\n1. 颐和园 - 晴天湖光山色最美\n2. 故宫 - 光线好适合拍照\n3. 天坛公园 - 视野开阔（模拟数据）"


# 将所有工具函数放入字典，供主循环调用
TOOLS = {
    "get_weather": get_weather,
    "get_attraction": get_attraction,
}
