# PyPI 源配置说明

## ✅ 问题已解决

已为你配置**全局 PyPI 源**，所有 Python 项目将自动使用正确配置。

---

## 📋 配置详情

### 全局配置（所有项目共享）
**位置**: `C:\Users\FX\AppData\Roaming\pip\pip.ini`

**配置内容**:
```ini
[global]
index-url = https://pypi.org/simple
extra-index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.org pypi.tuna.tsinghua.edu.cn
timeout = 60
```

### 项目级配置（当前项目）
**位置**: `.pip/pip.conf`

**优先级**: 项目级 > 全局

---

## 🎯 配置说明

### 1. **主源：官方 PyPI**
- URL: `https://pypi.org/simple`
- 优点：包最全，agentscope 等包都能找到
- 缺点：国内访问可能稍慢

### 2. **备用源：清华镜像**
- URL: `https://pypi.tuna.tsinghua.edu.cn/simple`
- 优点：国内访问速度快
- 缺点：部分包可能没有（如 agentscope）

### 3. **工作原理**
```
pip install agentscope
    ↓
先尝试从官方源下载
    ↓
如果失败，自动尝试清华源
    ↓
安装成功 ✅
```

---

## 🔍 验证配置

### 查看当前配置
```bash
pip config list
```

### 查看配置文件位置
```bash
pip config debug
```

### 测试安装 agentscope
```bash
pip install agentscope --dry-run
```

---

## 📝 常见问题

### Q1: 为什么之前总是去清华源？
**A**: 你的 pip 全局配置默认设置了清华源。

### Q2: 为什么 agentscope 在清华源找不到？
**A**: agentscope 是比较新的包，国内镜像源可能没有及时同步。

### Q3: 会影响其他项目吗？
**A**: 不会。这是**全局配置**，所有项目都会受益：
- ✅ 优先使用官方源（包最全）
- ✅ 失败时自动切换到清华源（速度快）
- ✅ 一劳永逸，无需每个项目单独配置

### Q4: 安装速度会慢吗？
**A**: 不会。配置策略是：
1. 先尝试官方源（如果网络好，速度正常）
2. 如果官方源超时，自动切换到清华源
3. 大部分常用包在两个源都有

---

## 🛠️ 修改配置

### 如果想改回清华源为主
```bash
pip config set global.index-url "https://pypi.tuna.tsinghua.edu.cn/simple"
pip config set global.extra-index-url "https://pypi.org/simple"
```

### 如果想使用阿里源
```bash
pip config set global.index-url "https://mirrors.aliyun.com/pypi/simple/"
```

### 其他可用镜像源
- 阿里云：`https://mirrors.aliyun.com/pypi/simple/`
- 腾讯云：`https://mirrors.cloud.tencent.com/pypi/simple/`
- 中科大：`https://pypi.mirrors.ustc.edu.cn/simple/`

---

## 📚 项目级配置（可选）

如果某个项目需要特殊配置，可以在项目根目录创建：
- `.pip/pip.conf` (Windows Git Bash)
- `.pip\pip.ini` (Windows CMD/PowerShell)

项目级配置会覆盖全局配置。

---

## ✨ 下一步

现在可以正常安装 agentscope 了：

```bash
# 在当前项目
pip install -r requirements.txt

# 或者在任何新项目
pip install agentscope dashscope
```

**无需再次配置！** 🎉

---

**配置时间**: 2026-03-09  
**适用系统**: Windows  
**Python 版本**: 3.11.9
