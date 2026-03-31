const BaseSkill = require('../base');
const fs = require('fs');

class PythonDetect extends BaseSkill {
  constructor() {
    super('python-detect', {
      description: '检测 Python 版本和 pip 镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Python',
      installed: false,
      version: null,
      pipConfigured: false,
      mirrorUrl: null,
      valid: false,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('python --version');
    if (versionResult.success) {
      result.installed = true;
      result.version = versionResult.output.replace('Python ', '');

      const versionMatch = result.version.match(/^3\.(\d+)/);
      if (versionMatch) {
        const minor = parseInt(versionMatch[1]);
        if (minor >= 11) {
          result.valid = true;
        } else {
          result.issues.push(`Python 版本过低 (${result.version}, 预期: 3.11+)`);
          result.suggestions.push('运行 python-install 技能安装新版本');
        }
      }
    } else {
      result.issues.push('Python 未安装');
      result.suggestions.push('运行 python-install 技能安装 Python');
    }

    const pipIniPath = `${process.env.APPDATA}\\pip\\pip.ini`;
    if (fs.existsSync(pipIniPath)) {
      const content = fs.readFileSync(pipIniPath, 'utf8');
      if (content.includes('tsinghua') || content.includes('pypi.tuna')) {
        result.pipConfigured = true;
        result.mirrorUrl = 'https://pypi.tuna.tsinghua.edu.cn';
      } else {
        result.issues.push('pip 镜像未配置');
        result.suggestions.push('运行 python-mirror 技能配置镜像');
      }
    } else {
      result.issues.push('pip.ini 不存在');
      result.suggestions.push('运行 python-mirror 技能创建配置');
    }

    result.status = result.valid && result.pipConfigured ? 'OK' : (result.issues.length > 0 ? 'CRITICAL' : 'WARN');
    return result;
  }
}

module.exports = new PythonDetect();
