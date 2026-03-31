const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class DockerDetect extends BaseSkill {
  constructor() {
    super('docker-detect', {
      description: '检测 Docker 状态和配置',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Docker',
      installed: false,
      version: null,
      running: false,
      configured: false,
      valid: true,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('docker --version');
    if (versionResult.success) {
      result.installed = true;
      const match = versionResult.output.match(/Docker version (\d+)/);
      result.version = match ? match[1] : 'unknown';
    } else {
      result.issues.push('Docker 未安装');
      result.valid = false;
      result.suggestions.push('安装 Docker Desktop');
    }

    const infoResult = this.exec('docker info');
    if (infoResult.success) {
      result.running = true;
    } else if (result.installed) {
      result.issues.push('Docker 未运行');
      result.suggestions.push('启动 Docker Desktop');
    }

    const daemonJsonPath = path.join(process.env.USERPROFILE || '', '.docker', 'daemon.json');
    if (fs.existsSync(daemonJsonPath)) {
      result.configured = true;
    } else {
      result.issues.push('Docker daemon.json 不存在');
      result.suggestions.push('运行 docker-mirror 技能创建配置');
    }

    result.status = result.running && result.configured ? 'OK' : (result.issues.length > 0 ? 'WARN' : 'OK');
    return result;
  }
}

module.exports = new DockerDetect();
