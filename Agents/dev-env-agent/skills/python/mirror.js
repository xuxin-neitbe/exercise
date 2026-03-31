const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class PythonMirror extends BaseSkill {
  constructor() {
    super('python-mirror', {
      description: '配置 pip 国内镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const mirrorUrl = params.mirrorUrl || 'https://pypi.tuna.tsinghua.edu.cn';
    const result = {
      name: 'pip Mirror',
      success: false,
      mirrorUrl: mirrorUrl,
      configPath: '',
      message: ''
    };

    try {
      const pipDir = path.join(process.env.APPDATA || '', 'pip');
      const pipIni = path.join(pipDir, 'pip.ini');
      result.configPath = pipIni;

      if (!fs.existsSync(pipDir)) {
        fs.mkdirSync(pipDir, { recursive: true });
      }

      const configContent = `[global]
index-url = ${mirrorUrl}
trusted-host = ${mirrorUrl.replace('https://', '').replace('http://', '')}
`;

      fs.writeFileSync(pipIni, configContent, 'utf8');
      result.success = true;
      result.message = `pip 镜像已配置: ${mirrorUrl}`;
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new PythonMirror();
