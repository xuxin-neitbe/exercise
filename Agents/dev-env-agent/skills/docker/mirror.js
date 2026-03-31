const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class DockerMirror extends BaseSkill {
  constructor() {
    super('docker-mirror', {
      description: '配置 Docker 国内镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const mirrors = params.mirrors || [
      'https://docker.1ms.run',
      'https://docker.xuanyuan.me'
    ];

    const result = {
      name: 'Docker Mirror',
      success: false,
      configPath: '',
      mirrors: mirrors,
      message: ''
    };

    try {
      const dockerDir = path.join(process.env.USERPROFILE || '', '.docker');
      const daemonJson = path.join(dockerDir, 'daemon.json');
      result.configPath = daemonJson;

      if (!fs.existsSync(dockerDir)) {
        fs.mkdirSync(dockerDir, { recursive: true });
      }

      const configJson = {
        'registry-mirrors': mirrors
      };

      fs.writeFileSync(daemonJson, JSON.stringify(configJson, null, 2), 'utf8');
      result.success = true;
      result.message = `Docker 镜像已配置: ${daemonJson}`;
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new DockerMirror();
