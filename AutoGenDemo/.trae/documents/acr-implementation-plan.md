# 阿里云容器镜像服务个人版实例实施方案

## 任务概述
将本地 Docker 镜像推送到阿里云容器镜像服务个人版实例，并实现从该实例拉取镜像。

## 可行性分析

### ✅ 技术可行性
1. **阿里云容器镜像服务个人版** 提供完整的镜像仓库功能
2. 支持标准的 Docker Registry API
3. 支持镜像推送、拉取、版本管理
4. 提供访问凭证和登录命令

### ✅ 优势
1. **国内访问速度快**：阿里云国内节点加速
2. **安全性高**：需要认证才能访问
3. **免费额度**：个人版提供免费存储空间
4. **管理方便**：Web 控制台管理镜像
5. **稳定性好**：阿里云官方运维保障

### ⚠️ 注意事项
1. 需要妥善保管访问凭证（用户名/密码）
2. 需要创建命名空间和镜像仓库
3. 镜像地址格式：`crpi-xxxx.cn-<地域>.personal.cr.aliyuncs.com/<命名空间>/<仓库名>:<版本>`

## 实施步骤

### 步骤 1：准备工作（阿里云控制台）

**⚠️ 重要：在开始之前，请先在阿里云控制台完成以下操作**

1.1 登录阿里云容器镜像服务控制台
- 访问：https://cr.console.aliyun.com/
- 使用账号：neitbe@qq.com 登录

1.2 创建命名空间
- 进入"个人版实例" > "命名空间"
- 点击"创建命名空间"
- 命名空间名称：`vibe-canva`
- 可见性：建议设置为"私有"

1.3 创建镜像仓库
- 进入"个人版实例" > "仓库管理"
- 点击"创建仓库"
- 创建以下两个仓库：
  - **仓库 1**：
    - 仓库名称：`vibe-canva-web`
    - 命名空间：`vibe-canva`
    - 摘要：前端 Web 应用镜像
    - 是否公开：私有
  
  - **仓库 2**：
    - 仓库名称：`vibe-canva-server`
    - 命名空间：`vibe-canva`
    - 摘要：后端 Server 应用镜像
    - 是否公开：私有

1.4 确认访问凭证
- 进入"个人版实例" > "访问凭证"
- 确认登录名：`neitbe@qq.com`
- 如忘记密码，可在此重置

### 步骤 2：本地环境检查

2.1 检查 Docker 是否运行
```bash
docker info
```
如果显示错误，请先启动 Docker Desktop

2.2 检查 Docker 版本
```bash
docker --version
```
建议版本：1.10.0 或更高

### 步骤 3：Docker 登录阿里云镜像仓库

**步骤 2 已完成后，执行以下登录操作**

**3.1 执行登录命令（使用管道命令）**

```bash
echo "XuXin@8245" | docker login --username=neitbe@qq.com --password-stdin crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com
```

**3.2 验证登录成功**
- 返回 "Login Succeeded" 表示成功
- 凭证会自动保存到 Docker 配置文件

**⚠️ 重要安全提醒：**
- 不要将包含明文密码的命令提交到 Git
- 在生产环境中使用环境变量：`echo "$DOCKER_PASSWORD" | docker login ...`
- 定期更换访问密码

### 步骤 4：构建并推送镜像

4.1 构建本地镜像
```bash
# 构建 web 应用
docker build -t vibe-canva-web -f apps/web/Dockerfile .

# 构建 server 应用
docker build -t vibe-canva-server -f apps/server/Dockerfile .
```

4.2 给镜像打标签
```bash
# web 应用
docker tag vibe-canva-web:latest crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest

# server 应用
docker tag vibe-canva-server:latest crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```

4.3 推送镜像
```bash
# 推送 web 应用
docker push crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest

# 推送 server 应用
docker push crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```

### 步骤 5：验证推送结果

5.1 在阿里云控制台查看
   - 登录容器镜像服务控制台
   - 进入对应仓库查看镜像版本

5.2 本地验证推送
```bash
docker images | grep crpi
```

### 步骤 6：测试拉取镜像

6.1 删除本地镜像
```bash
docker rmi crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest
docker rmi crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```

6.2 拉取镜像
```bash
docker pull crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest
docker pull crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```

6.3 验证拉取成功
```bash
docker images | grep crpi
```

### 步骤 7：自动化脚本（可选）
7.1 创建推送脚本 `push-to-acr.sh`
7.2 创建拉取脚本 `pull-from-acr.sh`
7.3 创建 CI/CD 集成脚本

## 需要确认的信息

### ✅ 已确认项
1. **个人版实例 ID**：crpi-4bbp29j96b2wio80
2. **实例所在地域**：cn-hangzhou（杭州）
3. **命名空间名称**：vibe-canva
4. **登录用户名**：neitbe@qq.com
5. **登录密码**：XuXin@8245（已提供）
6. **镜像版本号**：latest（可后续改为语义化版本或 git commit hash）

### 🔧 待创建项
1. **镜像仓库**：需要在阿里云控制台创建
   - vibe-canva-web
   - vibe-canva-server

## 安全建议

### 🔒 凭证管理
1. **不要将密码提交到 Git**
2. 使用 Docker 凭证助手
3. 在 CI/CD 中使用环境变量存储密码
4. 定期更换访问密码

### 🔒 访问控制
1. 设置仓库访问权限
2. 启用镜像漏洞扫描
3. 定期清理旧镜像

## 常见问题与故障排查

### ❌ 问题 1：Docker 无法连接
**错误信息**：`Cannot connect to the Docker daemon`

**解决方案**：
- 启动 Docker Desktop
- 等待 Docker Desktop 完全启动（托盘图标停止闪烁）
- 运行 `docker info` 验证

### ❌ 问题 2：登录失败
**错误信息**：`unauthorized: authentication required`

**解决方案**：
- 检查用户名密码是否正确
- 在阿里云控制台重置密码
- 确认实例状态正常

### ❌ 问题 3：仓库不存在
**错误信息**：`denied: requested access to the resource is denied`

**解决方案**：
- 在阿里云控制台创建对应的镜像仓库
- 确认命名空间名称正确
- 检查仓库访问权限设置

### ❌ 问题 4：推送超时
**错误信息**：`net/http: TLS handshake timeout`

**解决方案**：
- 检查网络连接
- 使用阿里云镜像加速器
- 尝试重新登录：`docker logout` 后重新 `docker login`

### ❌ 问题 5：磁盘空间不足
**错误信息**：`no space left on device`

**解决方案**：
```bash
# 清理未使用的镜像
docker image prune -a

# 清理停止的容器
docker container prune

# 查看磁盘使用情况
docker system df
```

## 最佳实践建议

### 📌 镜像版本管理
1. **开发环境**：使用 `latest` 或 `dev-{date}`
2. **测试环境**：使用 `test-{git-commit-hash}`
3. **生产环境**：使用语义化版本 `v1.0.0`

### 📌 镜像大小优化
1. 使用多阶段构建（已实现）
2. 选择轻量级基础镜像（Alpine）
3. 清理构建缓存

### 📌 Windows 特殊说明
1. 使用 Git Bash 或 PowerShell 运行命令
2. 路径分隔符使用正斜杠 `/`
3. Docker Desktop 需要 WSL2 支持
4. 确保 Docker Desktop 分配足够内存（建议 4GB+）

## 下一步行动

### 必须完成的步骤
1. ✅ 实例信息已确认
2. ⏳ **在阿里云控制台创建镜像仓库**（vibe-canva-web、vibe-canva-server）
   - 访问：https://cr.console.aliyun.com/
   - 参考步骤 1 详细说明
3. ⏳ 执行本地登录测试
4. ⏳ 测试推送和拉取流程
5. ⏳ 验证成功后更新文档

### 可选优化
- [ ] 创建自动化推送脚本
- [ ] 集成到 CI/CD 流程
- [ ] 配置镜像漏洞扫描
- [ ] 设置镜像保留策略

## 快速开始命令汇总

### 登录（使用管道命令）
```bash
echo "XuXin@8245" | docker login --username=neitbe@qq.com --password-stdin crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com
```

### 构建并推送
```bash
# 构建
docker build -t vibe-canva-web -f apps/web/Dockerfile .
docker build -t vibe-canva-server -f apps/server/Dockerfile .

# 打标签
docker tag vibe-canva-web:latest crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest
docker tag vibe-canva-server:latest crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest

# 推送
docker push crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest
docker push crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```

### 拉取
```bash
docker pull crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-web:latest
docker pull crpi-4bbp29j96b2wio80.cn-hangzhou.personal.cr.aliyuncs.com/vibe-canva/vibe-canva-server:latest
```
