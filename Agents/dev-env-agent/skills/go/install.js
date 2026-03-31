const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class GoInstall extends BaseSkill {
  constructor() {
    super('go-install', {
      description: '安装 Go',
      version: '1.0.0'
    });
  }

  async execute(params = {}) {
    const version = params.version || '1.23.4';
    const result = {
      name: 'Go Install',
      success: false,
      version: version,
      message: '',
      installedVersion: null
    };

    const checkResult = this.exec('go version');
    if (checkResult.success) {
      const match = checkResult.output.match(/go(\d+\.\d+)/);
      result.success = true;
      result.message = `Go 已安装: ${match ? match[1] : 'unknown'}`;
      result.installedVersion = match ? match[1] : null;
      return result;
    }

    result.message = `开始安装 Go ${version}...`;

    try {
      const tempDir = process.env.TEMP || '/tmp';
      const installer = path.join(tempDir, `go${version}.windows-amd64.msi`);

      const urls = [
        `https://go.dev/dl/go${version}.windows-amd64.msi`,
        `https://npmmirror.com/mirrors/go/${version}/go${version}.windows-amd64.msi`
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

      if (downloaded) {
        this.exec(`msiexec /i "${installer}" /qn`, { timeout: 300000 });
        try { fs.unlinkSync(installer); } catch {}
      } else {
        result.message = '下载失败，请手动安装 Go';
        return result;
      }

      const finalCheck = this.exec('go version');
      if (finalCheck.success) {
        const match = finalCheck.output.match(/go(\d+\.\d+)/);
        result.success = true;
        result.installedVersion = match ? match[1] : version;
        result.message = `Go 安装成功: ${result.installedVersion}`;
      } else {
        result.message = 'Go 安装可能需要重启终端';
      }
    } catch (error) {
      result.message = `安装失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new GoInstall();
