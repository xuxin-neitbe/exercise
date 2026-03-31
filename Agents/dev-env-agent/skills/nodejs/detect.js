const BaseSkill = require('../base');

class NodejsDetect extends BaseSkill {
  constructor() {
    super('nodejs-detect', {
      description: '检测 Node.js 版本和 npm registry',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Node.js',
      installed: false,
      version: null,
      registry: null,
      valid: false,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('node -v');
    if (versionResult.success) {
      result.installed = true;
      result.version = versionResult.output.replace('v', '');

      const majorVersion = parseInt(result.version.split('.')[0]);
      const expectedMajor = params.expectedMajor || 22;

      if (majorVersion >= expectedMajor || majorVersion === 24) {
        result.valid = true;
      } else {
        result.issues.push(`Node.js 版本过低 (${result.version}, 预期: ${expectedMajor}.x 或 24.x)`);
        result.suggestions.push('运行 nodejs-install 技能安装新版本');
      }
    } else {
      result.issues.push('Node.js 未安装');
      result.suggestions.push('运行 nodejs-install 技能安装 Node.js');
    }

    const registryResult = this.exec('npm config get registry');
    if (registryResult.success) {
      result.registry = registryResult.output;
      if (registryResult.output.includes('npmmirror')) {
        result.valid = result.valid && true;
      } else {
        result.issues.push(`npm registry 未配置国内镜像 (当前: ${registryResult.output})`);
        result.suggestions.push('运行 nodejs-mirror 技能配置镜像');
      }
    }

    result.status = result.valid ? 'OK' : (result.issues.length > 0 ? 'CRITICAL' : 'WARN');
    return result;
  }
}

module.exports = new NodejsDetect();
