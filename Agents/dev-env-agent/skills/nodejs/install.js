const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class NodejsInstall extends BaseSkill {
  constructor() {
    super('nodejs-install', {
      description: '安装 Node.js',
      version: '1.0.0'
    });
  }

  async execute(params = {}) {
    const version = params.version || '22.14.0';
    const result = {
      name: 'Node.js Install',
      success: false,
      version: version,
      message: '',
      installedVersion: null
    };

    const checkResult = this.exec('node -v');
    if (checkResult.success) {
      const currentVersion = checkResult.output.replace('v', '');
      result.success = true;
      result.message = `Node.js 已安装: v${currentVersion}`;
      result.installedVersion = currentVersion;
      return result;
    }

    result.message = `开始安装 Node.js ${version}...`;

    try {
      const tempDir = process.env.TEMP || '/tmp';
      const installer = path.join(tempDir, `node-${version}-x64.msi`);

      const urls = [
        `https://nodejs.org/dist/v${version}/node-v${version}-x64.msi`,
        `https://npmmirror.com/mirrors/node/v${version}/node-v${version}-x64.msi`
      ];

      let downloaded = false;
      for (const url of urls) {
        console.log(`尝试下载: ${url}`);
        try {
          this.exec(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${installer}' -UseBasicParsing"`, { timeout: 180000 });
          if (fs.existsSync(installer)) {
            downloaded = true;
            break;
          }
        } catch (e) {
          console.log(`下载失败，尝试下一个镜像...`);
        }
      }

      if (!downloaded) {
        result.message = '下载失败，尝试使用 winget...';
        this.exec('winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements', { timeout: 300000 });
      } else {
        this.exec(`msiexec /i "${installer}" /qn`, { timeout: 300000 });
        try { fs.unlinkSync(installer); } catch {}
      }

      const finalCheck = this.exec('node -v');
      if (finalCheck.success) {
        result.success = true;
        result.installedVersion = finalCheck.output.replace('v', '');
        result.message = `Node.js 安装成功: v${result.installedVersion}`;
      } else {
        result.message = 'Node.js 安装可能需要重启终端';
      }
    } catch (error) {
      result.message = `安装失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new NodejsInstall();
