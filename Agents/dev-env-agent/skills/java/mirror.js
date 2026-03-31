const BaseSkill = require('../base');
const fs = require('fs');
const path = require('path');

class JavaMirror extends BaseSkill {
  constructor() {
    super('java-mirror', {
      description: '配置 Java/Maven 国内镜像（阿里云）',
      version: '1.0.0'
    });
  }

  execute(params = {}) {
    const result = {
      name: 'Java Mirror',
      success: false,
      configPath: '',
      message: ''
    };

    try {
      const m2Dir = path.join(process.env.USERPROFILE || '', '.m2');
      const settingsXml = path.join(m2Dir, 'settings.xml');
      result.configPath = settingsXml;

      if (!fs.existsSync(m2Dir)) {
        fs.mkdirSync(m2Dir, { recursive: true });
      }

      const settingsContent = `<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
`;

      fs.writeFileSync(settingsXml, settingsContent, 'utf8');
      result.success = true;
      result.message = `Maven 镜像已配置: ${settingsXml}`;
    } catch (error) {
      result.message = `配置失败: ${error.message}`;
    }

    return result;
  }
}

module.exports = new JavaMirror();
