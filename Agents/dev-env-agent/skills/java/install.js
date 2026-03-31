const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class JavaInstall extends BaseSkill {
  constructor() {
    super('java-install', {
      description: '安装 Java (JDK)',
      version: '1.0.0'
    });
  }

  async execute(params = {}) {
    const version = params.version || '21';
    const result = {
      name: 'Java Install',
      success: false,
      version: version,
      message: '',
      installedVersion: null
    };

    const checkResult = this.exec('java -version 2>&1');
    if (checkResult.success) {
      const match = checkResult.output.match(/(\d+\.\d+\.\d+)/);
      result.success = true;
      result.message = `Java 已安装: ${match ? match[1] : 'unknown'}`;
      result.installedVersion = match ? match[1] : null;
      return result;
    }

    result.message = `开始安装 Java ${version}...`;

    try {
      const tempDir = process.env.TEMP || '/tmp';
      const installer = path.join(tempDir, `jdk-${version}.msi`);

      const urls = [
        `https://download.oracle.com/java/${version}/latest/jdk-${version}_windows-x64_bin.msi`,
        `https://mirrors.aliyun.com/adoptium/temurin${version}-bin/jdk-${version}_windows-x64_hotspot.msi`
      ];

      let downloaded = false;
      for (const url of urls) {
        console.log(`尝试下载: ${url}`);
        try {
          this.exec(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${installer}' -UseBasicParsing"`, { timeout: 300000 });
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
        result.message = '下载失败，尝试使用 winget...';
        this.exec('winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements', { timeout: 300000 });
      }

      const finalCheck = this.exec('java -version 2>&1');
      if (finalCheck.success) {
        const match = finalCheck.output.match(/(\d+\.\d+\.\d+)/);
        result.success = true;
        result.installedVersion = match ? match[1] : version;
        result.message = `Java 安装成功: ${result.installedVersion}`;
      } else {
        result.message = 'Java 安装可能需要重启终端';
      }
    } catch (error) {
      result.message = `安装失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new JavaInstall();
