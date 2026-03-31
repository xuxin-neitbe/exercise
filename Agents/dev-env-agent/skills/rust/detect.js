const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class RustDetect extends BaseSkill {
  constructor() {
    super('rust-detect', {
      description: '检测 Rust 和 Cargo 配置',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Rust',
      installed: false,
      version: null,
      cargoConfigured: false,
      valid: false,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('rustc --version');
    if (versionResult.success) {
      result.installed = true;
      const match = versionResult.output.match(/rustc (\d+\.\d+)/);
      result.version = match ? match[1] : 'unknown';
      result.valid = true;
    } else {
      result.issues.push('Rust 未安装');
      result.suggestions.push('运行 rust-install 技能安装 Rust');
    }

    const cargoConfigPath = path.join(process.env.USERPROFILE || '', '.cargo', 'config.toml');
    if (fs.existsSync(cargoConfigPath)) {
      const content = fs.readFileSync(cargoConfigPath, 'utf8');
      if (content.includes('rsproxy')) {
        result.cargoConfigured = true;
      } else {
        result.issues.push('Cargo 镜像未配置');
        result.suggestions.push('运行 rust-mirror 技能配置镜像');
      }
    } else {
      result.issues.push('Cargo 配置文件不存在');
      result.suggestions.push('运行 rust-mirror 技能创建配置');
    }

    result.status = result.valid && result.cargoConfigured ? 'OK' : (result.issues.length > 0 ? 'CRITICAL' : 'WARN');
    return result;
  }
}

module.exports = new RustDetect();
