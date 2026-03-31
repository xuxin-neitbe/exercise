const BaseSkill = require('../base');

class NodejsMirror extends BaseSkill {
  constructor() {
    super('nodejs-mirror', {
      description: '配置 npm 国内镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const registry = params.registry || 'https://registry.npmmirror.com';
    const result = {
      name: 'npm Mirror',
      success: false,
      registry: registry,
      message: ''
    };

    try {
      this.execSafe(`npm config set registry ${registry}`);
      const checkResult = this.exec('npm config get registry');

      if (checkResult.success && checkResult.output.includes('npmmirror')) {
        result.success = true;
        result.message = `npm 镜像已配置: ${registry}`;
      } else {
        result.message = `npm 镜像配置失败，当前: ${checkResult.output}`;
      }
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new NodejsMirror();
