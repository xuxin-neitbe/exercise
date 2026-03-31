const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class RustMirror extends BaseSkill {
  constructor() {
    super('rust-mirror', {
      description: '配置 Cargo 国内镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Cargo Mirror',
      success: false,
      configPath: '',
      message: ''
    };

    try {
      const cargoDir = path.join(process.env.USERPROFILE || '', '.cargo');
      const cargoConfig = path.join(cargoDir, 'config.toml');
      result.configPath = cargoConfig;

      if (!fs.existsSync(cargoDir)) {
        fs.mkdirSync(cargoDir, { recursive: true });
      }

      const configContent = `[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[net]
git-fetch-with-cli = true
`;

      fs.writeFileSync(cargoConfig, configContent, 'utf8');
      result.success = true;
      result.message = `Cargo 镜像已配置: ${cargoConfig}`;
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new RustMirror();
