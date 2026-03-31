# 错误处理

## 错误码列表

### INVALID_TECH_STACK

**说明：** 不支持的技术栈

**原因：**
- tech_stack 值不在允许范围内
- 拼写错误

**解决方案：**
检查 tech_stack 的值，必须是以下之一：
- `nodejs-express-react`
- `java-springboot-vue`
- `python-fastapi-react`
- `go-gin-vue`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TECH_STACK",
    "message": "不支持的技术栈：invalid",
    "details": {
      "provided_stack": "invalid",
      "valid_stacks": ["nodejs-express-react", "java-springboot-vue", "python-fastapi-react", "go-gin-vue"]
    }
  }
}
```

### DOCKER_NOT_INSTALLED

**说明：** Docker 未安装

**原因：**
- 系统未安装 Docker
- Docker 未运行

**解决方案：**
1. 安装 Docker：https://docs.docker.com/get-docker/
2. 启动 Docker 服务
3. 验证安装：`docker --version`

```json
{
  "success": false,
  "error": {
    "code": "DOCKER_NOT_INSTALLED",
    "message": "Docker 未安装或不可用",
    "details": {
      "command": "docker --version",
      "error": "command not found"
    }
  }
}
```

### BUILD_FAILED

**说明：** 构建失败

**原因：**
- Dockerfile 语法错误
- 依赖安装失败
- 构建脚本错误

**解决方案：**
1. 检查 Dockerfile 语法
2. 查看详细构建日志
3. 验证依赖配置

```json
{
  "success": false,
  "error": {
    "code": "BUILD_FAILED",
    "message": "Docker 镜像构建失败",
    "details": {
      "stage": "npm install",
      "error": "npm ERR! code ENOENT",
      "log_file": "/var/log/docker-build.log"
    }
  }
}
```

### PUSH_FAILED

**说明：** 推送失败

**原因：**
- ACR 认证失败
- 网络问题
- 镜像太大

**解决方案：**
1. 检查 ACR 凭证
2. 验证网络连接
3. 压缩镜像大小

```json
{
  "success": false,
  "error": {
    "code": "PUSH_FAILED",
    "message": "推送到 ACR 失败",
    "details": {
      "registry": "crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com",
      "error": "denied: requested access to the resource is denied"
    }
  }
}
```

### IMAGE_NOT_FOUND

**说明：** 镜像不存在

**原因：**
- 镜像未构建
- 标签错误
- 镜像已删除

**解决方案：**
1. 重新构建镜像
2. 检查镜像标签
3. 列出本地镜像：`docker images`

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_NOT_FOUND",
    "message": "镜像不存在：my-shop-server:latest",
    "details": {
      "image": "my-shop-server:latest",
      "available_images": ["my-shop-server:1.0.0", "node:18-alpine"]
    }
  }
}
```

## 错误处理最佳实践

### 1. 验证前置条件

```javascript
async function validatePrerequisites() {
  const errors = [];
  
  // 检查 Docker
  try {
    await exec('docker --version');
  } catch (error) {
    errors.push({
      code: 'DOCKER_NOT_INSTALLED',
      message: 'Docker 未安装'
    });
  }
  
  // 检查 ACR 凭证
  if (!process.env.ACR_USERNAME || !process.env.ACR_PASSWORD) {
    errors.push({
      code: 'MISSING_ACR_CREDENTIALS',
      message: '缺少 ACR 凭证'
    });
  }
  
  if (errors.length > 0) {
    throw new Error(JSON.stringify(errors, null, 2));
  }
}
```

### 2. 捕获详细错误

```javascript
try {
  await buildImage();
} catch (error) {
  const detailedError = {
    code: 'BUILD_FAILED',
    message: 'Docker 镜像构建失败',
    details: {
      stage: error.stage,
      stdout: error.stdout,
      stderr: error.stderr,
      exitCode: error.exitCode
    }
  };
  throw new Error(JSON.stringify(detailedError));
}
```

### 3. 提供恢复建议

```javascript
function getRecoverySuggestion(error) {
  switch (error.code) {
    case 'DOCKER_NOT_INSTALLED':
      return '请安装 Docker: https://docs.docker.com/get-docker/';
    
    case 'BUILD_FAILED':
      return '检查 Dockerfile 语法和依赖配置，查看详细构建日志';
    
    case 'PUSH_FAILED':
      return '验证 ACR 凭证和网络连接，确认镜像标签格式正确';
    
    default:
      return '请查看错误详情并联系支持';
  }
}
```

## 调试技巧

### 1. 启用详细日志

```bash
# Docker 详细日志
export DOCKER_BUILDKIT=1
docker build --progress=plain -t my-shop-server ./apps/server

# 查看 Docker 守护进程日志
journalctl -u docker -f
```

### 2. 构建日志分析

```bash
# 保存构建日志
docker build -t my-shop-server ./apps/server 2>&1 | tee build.log

# 分析错误
grep -i error build.log
grep -i failed build.log
```

### 3. 进入容器调试

```bash
# 构建调试镜像
docker build --target builder -t debug-image ./apps/server

# 进入容器
docker run --rm -it debug-image sh

# 检查环境
ls -la
cat package.json
npm list
```

## 常见问题排查

### 问题 1：构建卡在 npm install

**症状：**
```
Step 3/10 : RUN npm install
[长时间无响应]
```

**排查：**
```bash
# 检查网络
docker run --rm node:18-alpine ping registry.npmjs.org

# 使用淘宝镜像
docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com ./apps/server
```

**解决：**
```dockerfile
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry ${NPM_REGISTRY}
RUN npm install
```

### 问题 2：镜像推送超时

**症状：**
```
Error: Pushing image timed out
```

**排查：**
```bash
# 检查镜像大小
docker images my-shop-server

# 检查网络速度
curl -o /dev/null -s -w "%{speed_download}\n" https://crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
```

**解决：**
```bash
# 压缩镜像
docker build --squash -t my-shop-server ./apps/server

# 使用阿里云 ECS 推送
scp my-shop-server.tar ecs-user@ecs-ip:/tmp/
ssh ecs-user@ecs-ip "docker load -i /tmp/my-shop-server.tar"
```

### 问题 3：权限不足

**症状：**
```
denied: requested access to the resource is denied
```

**排查：**
```bash
# 检查登录状态
docker login https://crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com

# 检查 RAM 权限
aliyun ram GetUserPolicy --UserName your-username
```

**解决：**
```bash
# 重新登录
docker logout crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
docker login -u your-username -p your-password crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com
```

## 错误预防

### 1. 构建前验证

```javascript
function validateBeforeBuild(config) {
  const required = ['dockerfile', 'context', 'imageName'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`缺少必填配置：${field}`);
    }
  }
  
  if (!fs.existsSync(config.dockerfile)) {
    throw new Error(`Dockerfile 不存在：${config.dockerfile}`);
  }
}
```

### 2. 推送前检查

```javascript
async function checkBeforePush(imageName) {
  // 检查镜像是否存在
  const { stdout } = await exec(`docker images ${imageName} -q`);
  if (!stdout.trim()) {
    throw new Error(`镜像不存在：${imageName}`);
  }
  
  // 检查网络连接
  try {
    await exec('ping -c 1 crpi-xxx.cn-hangzhou.personal.cr.aliyuncs.com');
  } catch (error) {
    throw new Error('无法连接到 ACR 仓库');
  }
}
```

### 3. 使用健康检查

```yaml
# docker-compose.yml
services:
  server:
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 监控和告警

### 1. 构建成功率监控

```javascript
// 记录构建结果
const metrics = {
  timestamp: new Date().toISOString(),
  imageName: 'my-shop-server',
  success: true,
  duration: 120 // seconds
};

// 发送到监控系统
sendToMonitoring(metrics);
```

### 2. 设置告警

```yaml
# 告警规则
- alert: DockerBuildFailed
  expr: rate(docker_build_failures_total[5m]) > 0.1
  for: 5m
  annotations:
    summary: "Docker 构建失败率过高"
    description: "过去 5 分钟内构建失败率超过 10%"
```

### 3. 日志聚合

```javascript
// 使用 Winston 记录日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'docker-build.log' })
  ]
});

logger.info('Build started', { imageName: 'my-shop-server' });
logger.error('Build failed', { error: error.message });
```
