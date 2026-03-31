# Clash 长期稳定代理配置指南

> **适用场景：** 长期、稳定地通过美国 Linux 服务器访问 GitHub、PyPI、Docker Hub 等依赖库官网  
> **最后更新：** 2026-03-11  
> **难度等级：** ⭐⭐⭐（中等）

---

## 📋 目录

- [方案概述](#方案概述)
- [前置准备](#前置准备)
- [服务端配置（美国 Linux 服务器）](#服务端配置美国-linux-服务器)
- [客户端配置（本地 Windows）](#客户端配置本地-windows)
- [Docker 容器代理配置](#docker-容器代理配置)
- [开发工具代理配置](#开发工具代理配置)
- [开机自启配置](#开机自启配置)
- [故障排查](#故障排查)
- [安全加固](#安全加固)

---

## 方案概述

### 为什么选择 Clash？

| 特性 | Clash | SSH 代理 | v2ray |
|------|-------|---------|-------|
| **稳定性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **配置复杂度** | 中等 | 简单 | 复杂 |
| **规则分流** | ✅ 支持 | ❌ 不支持 | ✅ 支持 |
| **多设备共享** | ✅ 支持 | ❌ 困难 | ✅ 支持 |
| **长期运行** | ✅ 优化 | ⚠️ 需保持 SSH | ✅ 优化 |

### 架构说明

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  本地 Windows   │         │  美国 Linux 服务器 │         │  互联网          │
│                 │         │                  │         │                 │
│  Clash for     │  ────▶  │  Clash Core      │  ────▶  │  GitHub         │
│  Windows       │ 代理请求 │  (Premium)       │ 转发请求 │  PyPI           │
│  (客户端)       │         │  (服务端)        │         │  Docker Hub     │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 前置准备

### 1. 服务器要求

- ✅ 美国 Linux 服务器（已安装 Docker）
- ✅ root 或 sudo 权限
- ✅ 开放的端口：7890（HTTP 代理）、7891（SOCKS5）、9090（外部控制）
- ✅ 稳定的网络连接

### 2. 本地环境

- Windows 10/11
- PowerShell 5.1+
- 管理员权限（配置系统代理时需要）

### 3. 订阅链接（可选）

如果有代理订阅链接，可以直接使用。没有的话可以跳过，手动配置节点。

---

## 服务端配置（美国 Linux 服务器）

### 步骤 1：SSH 登录服务器

```bash
# Windows PowerShell
ssh root@your-server-ip

# 输入密码登录
```

### 步骤 2：创建 Clash 目录

```bash
# 创建安装目录
sudo mkdir -p /opt/clash
cd /opt/clash

# 创建配置目录
sudo mkdir -p /etc/clash
```

### 步骤 3：下载 Clash Premium Core

```bash
# 下载最新稳定版（amd64 架构）
# 如果服务器是 ARM 架构（如树莓派），下载 arm64 版本
sudo wget https://github.com/Dreamacro/clash/releases/download/premium/clash-linux-amd64-premium-1.18.0.gz -O clash.gz

# 解压
sudo gunzip clash.gz

# 添加执行权限
sudo chmod +x clash

# 移动到安装目录
sudo mv clash /opt/clash/clash

# 验证版本
/opt/clash/clash -v
```

**输出示例：**
```
Clash premium linux amd64 2023.10.12
```

### 步骤 4：创建配置文件

```bash
# 编辑配置文件
sudo nano /etc/clash/config.yaml
```

**粘贴以下配置：**

```yaml
# ============================================================================
# Clash Premium 配置文件
# ============================================================================

# 外部控制（Dashboard）
external-controller: 0.0.0.0:9090

# 外部 UI 目录（可选）
external-ui: ui

# 密钥（用于 Dashboard 认证）
secret: "your-secret-key-change-this"

# 监听端口
port: 7890        # HTTP 代理端口
socks-port: 7891  # SOCKS5 代理端口
redir-port: 7892  # Transparent proxy port (Linux)

# 允许局域网访问（多设备共享）
allow-lan: true

# 绑定地址（允许所有网卡）
bind-address: "*"

# 运行模式：rule（规则模式）、global（全局模式）、direct（直连模式）
mode: rule

# 日志级别：silent、error、warning、info、debug
log-level: info

# DNS 配置
dns:
  enable: true
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 8.8.8.8
    - 8.8.4.4
    - 1.1.1.1
  fallback:
    - tls://8.8.8.8:853
    - tls://1.1.1.1:853
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4

# 代理组配置
proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - DIRECT
      - US-Server
    
  - name: GitHub
    type: select
    proxies:
      - PROXY
      - DIRECT
      
  - name: Download
    type: select
    proxies:
      - PROXY
      - DIRECT

# 规则配置
rules:
  # GitHub 相关
  - DOMAIN-SUFFIX,github.com,PROXY
  - DOMAIN-SUFFIX,githubusercontent.com,PROXY
  - DOMAIN-SUFFIX,github.io,PROXY
  
  # Python PyPI
  - DOMAIN-SUFFIX,pypi.org,PROXY
  - DOMAIN-SUFFIX,python.org,PROXY
  
  # Docker
  - DOMAIN-SUFFIX,docker.io,PROXY
  - DOMAIN-SUFFIX,dockerhub.com,PROXY
  
  # Node.js npm
  - DOMAIN-SUFFIX,npmjs.org,PROXY
  - DOMAIN-SUFFIX,npmjs.com,PROXY
  
  # 其他开发工具
  - DOMAIN-SUFFIX,stackoverflow.com,PROXY
  - DOMAIN-SUFFIX,maven.org,PROXY
  
  # 国内网站直连
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-KEYWORD,.cn,DIRECT
  
  # 局域网直连
  - GEOIP,LAN,DIRECT
  
  # 最终规则
  - MATCH,PROXY

# 自定义代理节点（如果没有订阅）
proxies:
  - name: "US-Server"
    type: socks5
    server: 127.0.0.1
    port: 7890
    # 如果服务器本身可以科学上网，这里可以配置上层代理
    # 否则删除这个 proxies 部分，使用订阅链接
```

**保存并退出：** `Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 5：使用订阅链接（推荐）

如果有订阅链接，覆盖配置文件：

```bash
# 备份原配置
sudo cp /etc/clash/config.yaml /etc/clash/config.yaml.bak

# 下载订阅配置（替换为你的订阅链接）
sudo wget -O /etc/clash/config.yaml "你的订阅链接"

# 验证配置文件
/opt/clash/clash -t -f /etc/clash/config.yaml
```

**输出 `configuration file validated` 表示配置正确。**

### 步骤 6：创建 systemd 服务文件

```bash
sudo nano /etc/systemd/system/clash.service
```

**粘贴以下内容：**

```ini
[Unit]
Description=Clash Premium Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/clash
ExecStart=/opt/clash/clash -f /etc/clash/config.yaml
Restart=on-failure
RestartSec=10s
LimitNOFILE=65535

# 日志输出
StandardOutput=journal
StandardError=journal
SyslogIdentifier=clash

[Install]
WantedBy=multi-user.target
```

**保存并退出：** `Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 7：启动 Clash 服务

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动 Clash
sudo systemctl start clash

# 设置开机自启
sudo systemctl enable clash

# 查看状态
sudo systemctl status clash

# 查看日志
sudo journalctl -u clash -f
```

**状态正常输出：**
```
● clash.service - Clash Premium Service
     Loaded: loaded (/etc/systemd/system/clash.service; enabled)
     Active: active (running)
```

### 步骤 8：配置防火墙

```bash
# 开放代理端口
sudo ufw allow 7890/tcp comment "Clash HTTP Proxy"
sudo ufw allow 7891/tcp comment "Clash SOCKS5 Proxy"
sudo ufw allow 7892/tcp comment "Clash Redir Proxy"
sudo ufw allow 9090/tcp comment "Clash Dashboard"

# 如果使用 iptables
sudo iptables -A INPUT -p tcp --dport 7890 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 7891 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 9090 -j ACCEPT

# 保存规则
sudo ufw reload
```

### 步骤 9：验证服务运行

```bash
# 检查端口监听
sudo netstat -tlnp | grep clash

# 应该看到：
# tcp   0   0 0.0.0.0:7890   0.0.0.0:*   LISTEN   xxx/clash
# tcp   0   0 0.0.0.0:7891   0.0.0.0:*   LISTEN   xxx/clash
# tcp   0   0 0.0.0.0:9090   0.0.0.0:*   LISTEN   xxx/clash

# 测试 HTTP 代理
curl -x http://your-server-ip:7890 https://api.ip.sb/ip

# 应该显示服务器 IP
```

---

## 客户端配置（本地 Windows）

### 方案 A：Clash for Windows（推荐）

#### 1. 下载 Clash for Windows

**下载地址：**
- GitHub: https://github.com/Fndroid/clash_for_windows/releases
- 选择最新版本（如 `Clash.for.Windows-0.20.39-portable.7z`）

**注意：** 如果无法访问 GitHub，可以在国内镜像站下载。

#### 2. 解压并运行

```bash
# 解压到任意目录（如 D:\Tools\Clash for Windows）
# 运行 Clash for Windows.exe
```

#### 3. 配置连接服务器

**方法 1：使用订阅链接**

1. 点击 **订阅** → **添加订阅**
2. 输入订阅链接
3. 点击 **更新订阅**

**方法 2：手动配置服务器**

1. 点击 **配置** → **新建配置**
2. 输入配置名称（如 `US-Server`）
3. 粘贴配置内容：

```yaml
external-controller: your-server-ip:9090
secret: "your-secret-key-change-this"
```

4. 点击 **保存**

#### 4. 启用代理

- 勾选 **系统代理**
- 选择 **规则模式** 或 **全局模式**
- 选择刚才创建的配置

#### 5. 验证代理

```bash
# PowerShell 测试
curl https://api.ip.sb/ip
# 应该显示美国服务器 IP

# 测试 GitHub 访问
curl https://github.com
```

---

### 方案 B：Clash Verge（现代化 UI）

#### 1. 下载 Clash Verge

**地址：** https://github.com/zzzgydi/clash-verge/releases

#### 2. 安装并配置

1. 安装 Clash Verge
2. 点击 **配置** → **添加配置**
3. 输入服务器信息：
   - **外部控制器：** `http://your-server-ip:9090`
   - **密钥：** `your-secret-key-change-this`
4. 启用配置

---

### 方案 C：手动配置系统代理

如果不想用客户端软件，可以手动配置：

#### 1. 创建代理脚本

**保存为 `proxy_on.ps1`：**

```powershell
# proxy_on.ps1 - 启用代理
$proxy = "http://your-server-ip:7890"
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 1
Set-ItemProperty -Path $regPath -Name ProxyServer -Value $proxy

Write-Host "✓ 代理已启用：$proxy" -ForegroundColor Green
Write-Host "  关闭代理运行：.\proxy_off.ps1" -ForegroundColor Yellow
```

**保存为 `proxy_off.ps1`：**

```powershell
# proxy_off.ps1 - 关闭代理
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 0
Set-ItemProperty -Path $regPath -Name ProxyServer -Value ""

Write-Host "✓ 代理已关闭" -ForegroundColor Green
```

#### 2. 以管理员身份运行

```powershell
# 右键 PowerShell → 以管理员身份运行
.\proxy_on.ps1
```

---

## Docker 容器代理配置

### 配置 Docker Daemon 使用代理

#### 1. 创建 Docker 配置

```bash
# 创建配置目录（Windows PowerShell 管理员）
New-Item -ItemType Directory -Force -Path "$env:ProgramData\docker\config"

# 创建配置文件
@"
{
  "proxies": {
    "http-proxy": "http://your-server-ip:7890",
    "https-proxy": "http://your-server-ip:7890",
    "no-proxy": "*.local,127.0.0.1,::1"
  }
}
"@ | Out-File -FilePath "$env:ProgramData\docker\config\daemon.json" -Encoding utf8
```

#### 2. 重启 Docker

```powershell
# 重启 Docker Desktop
# 或者在命令行
Restart-Service com.docker.service
```

### 配置 Dockerfile 使用代理

```dockerfile
# 在 Dockerfile 开头添加
ARG HTTP_PROXY=http://your-server-ip:7890
ARG HTTPS_PROXY=http://your-server-ip:7890

ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY

# 后续的安装命令会自动使用代理
RUN apt update && apt install -y python3-pip
RUN pip install requests flask
```

### 配置 docker-compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      args:
        - HTTP_PROXY=http://your-server-ip:7890
        - HTTPS_PROXY=http://your-server-ip:7890
    environment:
      - HTTP_PROXY=http://your-server-ip:7890
      - HTTPS_PROXY=http://your-server-ip:7890
      - NO_PROXY=localhost,127.0.0.1
    image: myapp:latest
```

---

## 开发工具代理配置

### 1. Git 配置

```bash
# 配置代理
git config --global http.proxy http://your-server-ip:7890
git config --global https.proxy http://your-server-ip:7890

# 验证配置
git config --global --get http.proxy
git config --global --get https.proxy

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 2. pip 配置（Python）

**Windows 配置文件位置：**
```
%APPDATA%\pip\pip.ini
# 完整路径：C:\Users\你的用户名\AppData\Roaming\pip\pip.ini
```

**创建配置文件：**

```ini
[global]
index-url = https://pypi.org/simple
proxy = http://your-server-ip:7890
trusted-host = pypi.org
               pypi.python.org
               files.pythonhosted.org

[install]
proxy = http://your-server-ip:7890
```

**使用 PowerShell 创建：**

```powershell
# 创建目录
New-Item -ItemType Directory -Force -Path "$env:APPDATA\pip"

# 创建配置文件
@"
[global]
index-url = https://pypi.org/simple
proxy = http://your-server-ip:7890
trusted-host = pypi.org
               pypi.python.org
               files.pythonhosted.org

[install]
proxy = http://your-server-ip:7890
"@ | Out-File -FilePath "$env:APPDATA\pip\pip.ini" -Encoding utf8
```

### 3. npm 配置（Node.js）

```bash
# 配置代理
npm config set proxy http://your-server-ip:7890
npm config set https-proxy http://your-server-ip:7890

# 验证配置
npm config get proxy
npm config get https-proxy

# 取消代理
npm config delete proxy
npm config delete https-proxy

# 使用国内镜像（推荐）
npm config set registry https://registry.npmmirror.com
```

### 4. Maven 配置（Java）

**编辑 `settings.xml`（通常在 `~/.m2/settings.xml`）：**

```xml
<settings>
  <proxies>
    <proxy>
      <id>clash-proxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>your-server-ip</host>
      <port>7890</port>
      <nonProxyHosts>localhost|127.0.0.1</nonProxyHosts>
    </proxy>
  </proxies>
</settings>
```

### 5. Gradle 配置（Java）

**编辑 `~/.gradle/gradle.properties`：**

```properties
systemProp.http.proxyHost=your-server-ip
systemProp.http.proxyPort=7890
systemProp.https.proxyHost=your-server-ip
systemProp.https.proxyPort=7890
systemProp.http.nonProxyHosts=localhost|127.0.0.1
systemProp.https.nonProxyHosts=localhost|127.0.0.1
```

### 6. Wget 配置

**创建 `~/.wgetrc`：**

```bash
http_proxy = http://your-server-ip:7890
https_proxy = http://your-server-ip:7890
use_proxy = on
```

### 7. curl 配置

**创建 `~/.curlrc`（Windows：`%USERPROFILE%\.curlrc`）：**

```bash
proxy = http://your-server-ip:7890
```

---

## 开机自启配置

### 服务端（Linux）

已经在 **步骤 6** 配置了 systemd 服务，开机自动启动。

**验证：**

```bash
# 查看是否启用自启
sudo systemctl is-enabled clash

# 应该输出：enabled
```

### 客户端（Windows）

#### 方法 1：使用任务计划程序

1. 按 `Win + R`，输入 `taskschd.msc`
2. 点击 **创建任务**
3. **常规** 选项卡：
   - 名称：`Clash Proxy`
   - 勾选 **使用最高权限运行**
   - 勾选 **不管用户是否登录都要运行**
4. **触发器** 选项卡：
   - 新建 → 开始任务：**登录时**
5. **操作** 选项卡：
   - 新建 → 启动程序
   - 程序：`D:\Tools\Clash for Windows\Clash for Windows.exe`
6. **条件** 选项卡：
   - 取消勾选 **只有在计算机使用交流电源时才启动**
7. 点击 **确定**

#### 方法 2：使用启动文件夹

1. 创建 Clash for Windows 快捷方式
2. 按 `Win + R`，输入 `shell:startup`
3. 将快捷方式复制到打开的文件夹

---

## 故障排查

### 1. 服务无法启动

```bash
# 查看日志
sudo journalctl -u clash -f

# 常见错误：
# - 配置文件格式错误：clash -t -f /etc/clash/config.yaml
# - 端口被占用：netstat -tlnp | grep 7890
# - 权限不足：确保以 root 运行
```

### 2. 代理无法连接

```bash
# 检查防火墙
sudo ufw status

# 检查端口监听
sudo netstat -tlnp | grep clash

# 测试本地连接
curl -x http://127.0.0.1:7890 https://www.google.com

# 测试远程连接（从其他机器）
curl -x http://server-ip:7890 https://www.google.com
```

### 3. DNS 解析问题

**编辑配置文件，修改 DNS：**

```yaml
dns:
  enable: true
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  nameserver:
    - 8.8.8.8
    - 1.1.1.1
    - 208.67.222.222  # OpenDNS
```

### 4. 速度慢

**优化配置：**

```yaml
# 开启 TCP BBR 拥塞控制（服务器端）
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# 永久生效
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 5. Clash for Windows 无法连接

**检查外部控制器配置：**

1. 打开 Clash for Windows
2. 点击 **配置**
3. 确保 **外部控制器** 地址正确：`http://server-ip:9090`
4. 确保 **密钥** 正确：`your-secret-key-change-this`

---

## 安全加固

### 1. 修改默认密钥

**编辑 `/etc/clash/config.yaml`：**

```yaml
secret: "your-strong-secret-key-here-change-this"
```

**重启服务：**

```bash
sudo systemctl restart clash
```

### 2. 限制访问 IP

**编辑配置文件：**

```yaml
# 只允许特定 IP 访问外部控制器
external-controller: 0.0.0.0:9090

# 在防火墙限制
sudo ufw allow from your-local-ip to any port 9090 proto tcp
```

### 3. 启用 TLS 加密（高级）

**使用 Nginx 反向代理：**

```bash
# 安装 Nginx
sudo apt install nginx -y

# 配置 Nginx
sudo nano /etc/nginx/sites-available/clash

# 添加：
server {
    listen 443 ssl http2;
    server_name clash.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/clash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 定期更新 Clash

```bash
# 检查最新版本
cd /opt/clash
latest_version=$(curl -s https://api.github.com/repos/Dreamacro/clash/releases/latest | grep "tag_name" | cut -d'"' -f4)

# 下载并替换
sudo wget https://github.com/Dreamacro/clash/releases/download/$latest_version/clash-linux-amd64-$latest_version.gz -O clash.gz
sudo gunzip clash.gz
sudo chmod +x clash
sudo mv clash /opt/clash/clash

# 重启服务
sudo systemctl restart clash
```

---

## 性能优化

### 1. 启用规则预加载

```yaml
# 在配置文件添加
profile:
  store-selected: true
  store-fake-ip: true
```

### 2. 调整并发连接数

```yaml
# 在配置文件添加
tcp-concurrent: true
```

### 3. 优化 DNS 缓存

```yaml
dns:
  enable: true
  cache-size: 4096  # 增大 DNS 缓存
```

---

## 监控与日志

### 1. 查看实时日志

```bash
sudo journalctl -u clash -f
```

### 2. 查看访问统计

**访问 Dashboard：**
```
http://your-server-ip:9090/ui
```

**使用 Yacd Dashboard（更美观）：**
```
http://your-server-ip:9090/ui/yacd
```

### 3. 监控资源使用

```bash
# CPU 和内存
htop -p $(pgrep clash)

# 网络连接
sudo netstat -antp | grep clash

# 带宽使用
sudo iftop -P -n
```

---

## 常见问题 FAQ

### Q1: Clash 服务突然停止怎么办？

```bash
# 查看日志
sudo journalctl -u clash -n 50

# 重启服务
sudo systemctl restart clash

# 如果还不行，检查配置文件
sudo clash -t -f /etc/clash/config.yaml
```

### Q2: 如何切换代理节点？

1. 打开 Clash for Windows
2. 点击 **代理** 标签
3. 选择其他节点
4. 或者切换到 **规则模式** 自动选择

### Q3: 可以多人共享一个服务器吗？

**可以！** 在配置文件中：

```yaml
# 允许局域网访问
allow-lan: true

# 在防火墙开放端口
sudo ufw allow from 192.168.1.0/24 to any port 7890,7891,9090 proto tcp
```

其他人配置客户端时，服务器地址填你的服务器 IP 即可。

### Q4: 如何备份配置？

```bash
# 备份
sudo cp /etc/clash/config.yaml /etc/clash/config.yaml.backup.$(date +%Y%m%d)

# 恢复
sudo cp /etc/clash/config.yaml.backup.20260311 /etc/clash/config.yaml
sudo systemctl restart clash
```

### Q5: 如何完全卸载 Clash？

```bash
# 停止服务
sudo systemctl stop clash
sudo systemctl disable clash

# 删除文件
sudo rm -rf /opt/clash
sudo rm /etc/systemd/system/clash.service
sudo rm -rf /etc/clash

# 重新加载 systemd
sudo systemctl daemon-reload
```

---

## 总结

### 配置完成检查清单

- [ ] 服务端 Clash 已安装并运行
- [ ] systemd 服务已配置并启用自启
- [ ] 防火墙已开放端口（7890、7891、9090）
- [ ] 本地 Clash for Windows 已配置
- [ ] 系统代理已启用
- [ ] 开发工具（Git、pip、npm）已配置代理
- [ ] Docker 已配置代理
- [ ] 可以正常访问 GitHub、PyPI 等网站

### 推荐配置组合

| 场景 | 推荐方案 |
|------|---------|
| **个人开发** | Clash for Windows + 系统代理 |
| **团队协作** | 服务端 Clash + 多客户端共享 |
| **Docker 开发** | Clash + Docker 代理配置 |
| **企业环境** | Clash + Nginx 反向代理 + TLS |

### 下一步

配置完成后，你可以：

1. ✅ 自由访问 GitHub、PyPI、Docker Hub
2. ✅ 快速安装依赖库
3. ✅ 克隆私有仓库
4. ✅ 拉取 Docker 镜像

---

## 参考资料

- [Clash 官方文档](https://github.com/Dreamacro/clash/wiki)
- [Clash Premium 下载](https://github.com/Dreamacro/clash/releases)
- [Clash for Windows](https://github.com/Fndroid/clash_for_windows)
- [Clash Verge](https://github.com/zzzgydi/clash-verge)
- [Yacd Dashboard](https://github.com/haishanh/yacd)

---

**文档版本：** v1.0  
**最后更新：** 2026-03-11  
**维护者：** 你的团队
