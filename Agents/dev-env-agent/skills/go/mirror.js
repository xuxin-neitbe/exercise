const BaseSkill = require('../base');

class GoMirror extends BaseSkill {
  constructor() {
    super('go-mirror', {
      description: '配置 Go 国内镜像代理',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const proxy = params.proxy || 'https://goproxy.cn,direct';
    const result = {
      name: 'Go Proxy',
      success: false,
      proxy: proxy,
      message: ''
    };

    try {
      this.execSafe(`go env -w GOPROXY=${proxy}`);
      const checkResult = this.exec('go env GOPROXY');

      if (checkResult.success && checkResult.output.includes('goproxy')) {
        result.success = true;
        result.message = `Go proxy 已配置: ${checkResult.output}`;
      } else {
        result.message = `Go proxy 配置失败，当前: ${checkResult.output}`;
      }
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new GoMirror();
