const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class JavaDetect extends BaseSkill {
  constructor() {
    super('java-detect', {
      description: '检测 Java 版本和 JAVA_HOME',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Java',
      installed: false,
      version: null,
      home: null,
      valid: false,
      issues: [],
      suggestions: []
    };

    const versionResult = this.exec('java -version 2>&1');
    if (versionResult.success) {
      result.installed = true;
      const match = versionResult.output.match(/(\d+\.\d+\.\d+)/);
      if (match) {
        result.version = match[1];
        const majorMatch = result.version.match(/^(\d+)/);
        const major = majorMatch ? parseInt(majorMatch[1]) : 0;

        if (major >= 11 && major <= 25) {
          result.valid = true;
        } else {
          result.issues.push(`Java 版本不在预期范围 (${result.version}, 预期: 11 - 25)`);
          result.suggestions.push('运行 java-install 技能安装新版本');
        }
      }
    } else {
      result.issues.push('Java 未安装');
      result.suggestions.push('运行 java-install 技能安装 Java');
    }

    const homeResult = this.exec('echo %JAVA_HOME%');
    if (homeResult.success && homeResult.output && !homeResult.output.includes('%JAVA_HOME%')) {
      result.home = homeResult.output;
    }

    result.status = result.valid ? 'OK' : (result.issues.length > 0 ? 'CRITICAL' : 'WARN');
    return result;
  }
}

module.exports = new JavaDetect();
