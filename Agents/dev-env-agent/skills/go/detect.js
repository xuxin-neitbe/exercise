const BaseSkill = require('../base');

class GoDetect extends BaseSkill {
  constructor() {
    super('go-detect', {
      description: '检测 Go 版本和 GOPROXY',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Go',
      installed: false,
      version: null,
      proxy: null,
      valid: false,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('go version');
    if (versionResult.success) {
      result.installed = true;
      const match = versionResult.output.match(/go(\d+\.\d+)/);
      if (match) {
        result.version = match[1];
        const minor = parseInt(result.version.split('.')[1]);
        if (minor >= 21 && minor <= 25) {
          result.valid = true;
        } else {
          result.issues.push(`Go 版本不在预期范围 (${result.version}, 预期: 1.21.x - 1.25.x)`);
          result.suggestions.push('运行 go-install 技能安装新版本');
        }
      }
    } else {
      result.issues.push('Go 未安装');
      result.suggestions.push('运行 go-install 技能安装 Go');
    }

    const proxyResult = this.exec('go env GOPROXY');
    if (proxyResult.success) {
      result.proxy = proxyResult.output;
      if (proxyResult.output.includes('goproxy')) {
        result.valid = result.valid && true;
      } else {
        result.issues.push(`Go proxy 未配置国内镜像 (当前: ${proxyResult.output})`);
        result.suggestions.push('运行 go-mirror 技能配置镜像');
      }
    }

    result.status = result.valid ? 'OK' : (result.issues.length > 0 ? 'CRITICAL' : 'WARN');
    return result;
  }
}

module.exports = new GoDetect();
