# API 密钥配置指南

## 🌤️ 阿里云天气 API 配置

### 第 1 步：注册阿里云账号
1. 访问：https://www.aliyun.com
2. 注册账号（需要实名认证）

### 第 2 步：购买免费天气 API
1. 访问阿里云市场：https://market.aliyun.com/products/57126001/cmapi026602.html
2. 点击"免费购买"或"0 元试用"
3. 完成购买流程

### 第 3 步：获取 APPCODE
1. 登录阿里云控制台
2. 进入"云市场" → "已购买的服务"
3. 找到天气 API，点击"管理"
4. 复制 APPCODE（类似：`1234567890abcdef`）

### 第 4 步：配置到代码中

#### 方式 A：直接在 agent.py 中配置
编辑 `agent.py` 文件：
```python
# 添加阿里云天气 API 配置
ALIYUN_WEATHER_APCODE = "你的 APPCODE"
os.environ['ALIYUN_WEATHER_APCODE'] = ALIYUN_WEATHER_APCODE
```

#### 方式 B：使用环境变量（推荐）
在终端中设置：
```bash
# Windows PowerShell
$env:ALIYUN_WEATHER_APCODE="你的 APPCODE"
```

---

## 🔍 Tavily API 配置（可选）

### 第 1 步：注册 Tavily 账号
1. 访问：https://app.tavily.com
2. 用邮箱注册

### 第 2 步：创建 API Key
1. 登录后进入 Dashboard
2. 点击 "Create API Key"
3. 复制 API Key（类似：`tvly-xxxxxxxxxxxx`）

### 第 3 步：配置到代码中

#### 方式 A：直接在 agent.py 中配置
编辑 `agent.py` 文件：
```python
# 添加 Tavily API 配置
TAVILY_API_KEY = "你的 API Key"
os.environ['TAVILY_API_KEY'] = TAVILY_API_KEY
```

#### 方式 B：使用环境变量
```bash
# Windows PowerShell
$env:TAVILY_API_KEY="你的 API Key"
```

---

## ✅ 完整配置示例

在 `agent.py` 中：
```python
# --- 1. 配置 LLM 客户端 ---
API_KEY = "sk-908dc71a548f48e4a0ed9b0a70b138a0"
BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
MODEL_ID = "qwen-flash"

# --- 2. 配置工具 API ---
# 阿里云天气 API
ALIYUN_WEATHER_APCODE = "你的 APPCODE"
os.environ['ALIYUN_WEATHER_APCODE'] = ALIYUN_WEATHER_APCODE

# Tavily 搜索 API
TAVILY_API_KEY = "你的 API Key"
os.environ['TAVILY_API_KEY'] = TAVILY_API_KEY
```

---

## 🆓 免费额度说明

| API 服务商 | 免费额度 | 超出后费用 |
|-----------|---------|-----------|
| **阿里云天气** | 每天 100-1000 次（根据活动） | 约 0.01 元/次 |
| **Tavily** | 每月 1000 次 | $0.01/次 |
| **通义千问** | 新用户免费额度 | 约 0.008 元/千 tokens |

---

## 🧪 测试配置

配置完成后，运行测试脚本：
```bash
python test_agent_simple.py
```

如果看到：
- ✅ `[DEBUG][get_weather] 正在发起 HTTP GET 请求...`
- ✅ `[DEBUG][get_weather] 收到响应，状态码：200`
- ✅ `[DEBUG][get_weather] 提取结果：weather_desc='晴', temp_c='25'`

说明天气 API 配置成功！

---

## ⚠️ 注意事项

1. **APPCODE 安全**
   - 不要提交到 Git
   - 不要公开分享
   - 建议使用环境变量

2. **API 限流**
   - 免费额度有限，测试时注意用量
   - 学习阶段建议用模拟数据

3. **API 稳定性**
   - 阿里云 API 国内访问稳定
   - 响应速度快（通常<500ms）

---

## 🔄 降级处理

如果未配置 API 密钥，程序会自动使用模拟数据：
```
北京当前天气：晴，气温 25 摄氏度（模拟数据）
```

这样可以在不配置 API 的情况下学习 Agent 工作原理！
