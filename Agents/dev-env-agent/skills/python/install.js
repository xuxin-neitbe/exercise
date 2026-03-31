const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class PythonInstall extends BaseSkill {
  constructor() {
    super('python-install', {
      description: '安装 Python',
      version: '1.0.0'
    });
  }

  async execute(params = {}) {
    const version = params.version || '3.11.7';
    const result = {
      name: 'Python Install',
      success: false,
      version: version,
      message: '',
      installedVersion: null
    };

    const checkResult = this.exec('python --version');
    if (checkResult.success) {
      result.success = true;
      result.message = `Python 已安装: ${checkResult.output.replace('Python ', '')}`;
      result.installedVersion = checkResult.output.replace('Python ', '');
      return result;
    }

    result.message = `开始安装 Python ${version}...`;

    try {
      const tempDir = process.env.TEMP || '/tmp';
      const installer = path.join(tempDir, `python-${version}-amd64.exe`);

      const urls = [
        `https://www.python.org/ftp/python/${version}/python-${version}-amd64.exe`,
        `https://npmmirror.com/mirrors/python/${version}/python-${version}-amd64.exe`
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
        this.exec('winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements', { timeout: 300000 });
      } else {
        this.exec(`"${installer}" /quiet InstallAllUsers=1 PrependPath=1`, { timeout: 300000 });
        try { fs.unlinkSync(installer); } catch {}
      }

      const finalCheck = this.exec('python --version');
      if (finalCheck.success) {
        result.success = true;
        result.installedVersion = finalCheck.output.replace('Python ', '');
        result.message = `Python 安装成功: ${result.installedVersion}`;
      } else {
        result.message = 'Python 安装可能需要重启终端';
      }
    } catch (error) {
      result.message = `安装失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new PythonInstall();
