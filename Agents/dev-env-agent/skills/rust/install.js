const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class RustInstall extends BaseSkill {
  constructor() {
    super('rust-install', {
      description: '安装 Rust',
      version: '1.0.0'
    });
  }

  async execute(params = {}) {
    const result = {
      name: 'Rust Install',
      success: false,
      message: '',
      installedVersion: null
    };

    const checkResult = this.exec('rustc --version');
    if (checkResult.success) {
      const match = checkResult.output.match(/rustc (\d+\.\d+)/);
      result.success = true;
      result.message = `Rust 已安装: ${match ? match[1] : 'unknown'}`;
      result.installedVersion = match ? match[1] : null;
      return result;
    }

    result.message = '开始安装 Rust...';

    try {
      const tempDir = process.env.TEMP || '/tmp';
      const rustupExe = path.join(tempDir, 'rustup-init.exe');

      const urls = [
        'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe',
        'https://mirrors.ustc.edu.cn/rust-static/rustup/rustup-init.exe',
        'https://rsproxy.cn/rustup-init.exe'
      ];

      let downloaded = false;
      for (const url of urls) {
        console.log(`尝试下载: ${url}`);
        try {
          process.env.RUSTUP_DIST_SERVER = 'https://static.rust-lang.org';
          process.env.RUSTUP_UPDATE_ROOT = 'https://static.rust-lang.org/rustup';
          this.exec(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${rustupExe}' -UseBasicParsing"`, { timeout: 120000 });
          if (fs.existsSync(rustupExe)) {
            const stats = fs.statSync(rustupExe);
            if (stats.size > 1000) {
              downloaded = true;
              break;
            }
          }
        } catch (e) {
          console.log(`下载失败: ${e.message}`);
        }
      }

      if (downloaded) {
        this.exec(`"${rustupExe}" -y`, { timeout: 300000 });
        try { fs.unlinkSync(rustupExe); } catch {}
      } else {
        result.message = '下载失败，请手动安装 Rust';
        return result;
      }

      const finalCheck = this.exec('rustc --version');
      if (finalCheck.success) {
        const match = finalCheck.output.match(/rustc (\d+\.\d+)/);
        result.success = true;
        result.installedVersion = match ? match[1] : 'unknown';
        result.message = `Rust 安装成功: ${result.installedVersion}`;
      } else {
        result.message = 'Rust 安装可能需要重启终端';
      }
    } catch (error) {
      result.message = `安装失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new RustInstall();
