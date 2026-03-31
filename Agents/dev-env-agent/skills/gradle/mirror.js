const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class GradleMirror extends BaseSkill {
  constructor() {
    super('gradle-mirror', {
      description: '配置 Gradle 国内镜像',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Gradle Mirror',
      success: false,
      configPath: '',
      message: ''
    };

    try {
      const gradleDir = path.join(process.env.USERPROFILE || '', '.gradle');
      const initGradle = path.join(gradleDir, 'init.gradle');
      result.configPath = initGradle;

      if (!fs.existsSync(gradleDir)) {
        fs.mkdirSync(gradleDir, { recursive: true });
      }

      const initContent = `allprojects {
    buildscript {
        repositories {
            maven { url 'https://maven.aliyun.com/repository/public' }
            maven { url 'https://maven.aliyun.com/repository/google' }
            maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        }
    }
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    }
}
`;

      fs.writeFileSync(initGradle, initContent, 'utf8');
      result.success = true;
      result.message = `Gradle 镜像已配置: ${initGradle}`;
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new GradleMirror();
