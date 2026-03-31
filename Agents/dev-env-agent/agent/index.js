const { callSkill, listSkills } = require('../skills');

class DevEnvAgent {
  constructor() {
    this.name = 'dev-env-agent';
    this.version = '1.0.0';
    this.description = 'Windows 开发环境配置 Agent';
  }

  async diagnose() {
    const results = {
      timestamp: new Date().toISOString(),
      overallStatus: 'OK',
      tools: []
    };

    const toolChecks = [
      { name: 'nodejs', skill: 'nodejs-detect' },
      { name: 'python', skill: 'python-detect' },
      { name: 'java', skill: 'java-detect' },
      { name: 'go', skill: 'go-detect' },
      { name: 'rust', skill: 'rust-detect' },
      { name: 'docker', skill: 'docker-detect' }
    ];

    for (const tool of toolChecks) {
      try {
        const result = await callSkill(tool.skill);
        results.tools.push({
          name: tool.name,
          status: result.status || 'UNKNOWN',
          ...result
        });

        if (result.status === 'CRITICAL') {
          results.overallStatus = 'CRITICAL';
        } else if (result.status === 'WARN' && results.overallStatus !== 'CRITICAL') {
          results.overallStatus = 'WARN';
        }
      } catch (error) {
        results.tools.push({
          name: tool.name,
          status: 'ERROR',
          error: error.message
        });
        results.overallStatus = 'CRITICAL';
      }
    }

    return results;
  }

  async fix(skillName) {
    const fixMap = {
      'nodejs': async () => {
        const detectResult = await callSkill('nodejs-detect');
        if (!detectResult.installed) {
          return await callSkill('nodejs-install');
        }
        if (!detectResult.registry?.includes('npmmirror')) {
          return await callSkill('nodejs-mirror');
        }
        return { success: true, message: 'Node.js 已就绪' };
      },
      'python': async () => {
        const detectResult = await callSkill('python-detect');
        if (!detectResult.installed) {
          return await callSkill('python-install');
        }
        if (!detectResult.pipConfigured) {
          return await callSkill('python-mirror');
        }
        return { success: true, message: 'Python 已就绪' };
      },
      'java': async () => {
        const detectResult = await callSkill('java-detect');
        if (!detectResult.installed) {
          return await callSkill('java-install');
        }
        return { success: true, message: 'Java 已就绪' };
      },
      'go': async () => {
        const detectResult = await callSkill('go-detect');
        if (!detectResult.installed) {
          return await callSkill('go-install');
        }
        if (!detectResult.proxy?.includes('goproxy')) {
          return await callSkill('go-mirror');
        }
        return { success: true, message: 'Go 已就绪' };
      },
      'rust': async () => {
        const detectResult = await callSkill('rust-detect');
        if (!detectResult.installed) {
          return await callSkill('rust-install');
        }
        if (!detectResult.cargoConfigured) {
          return await callSkill('rust-mirror');
        }
        return { success: true, message: 'Rust 已就绪' };
      },
      'docker': async () => {
        const detectResult = await callSkill('docker-detect');
        if (!detectResult.configured) {
          return await callSkill('docker-mirror');
        }
        return { success: true, message: 'Docker 已就绪' };
      }
    };

    if (fixMap[skillName]) {
      return await fixMap[skillName]();
    }

    return { success: false, message: `Unknown tool: ${skillName}` };
  }

  async setupAll() {
    const results = {
      success: true,
      tools: []
    };

    const tools = ['nodejs', 'python', 'java', 'go', 'rust', 'docker'];

    for (const tool of tools) {
      try {
        const result = await this.fix(tool);
        results.tools.push({ tool, ...result });
        if (!result.success) {
          results.success = false;
        }
      } catch (error) {
        results.tools.push({ tool, success: false, error: error.message });
        results.success = false;
      }
    }

    await callSkill('maven-mirror');
    await callSkill('gradle-mirror');

    return results;
  }

  async runDoctor() {
    const diagnoseResult = await this.diagnose();

    console.log('\n🩺 环境健康检查...\n');

    for (const tool of diagnoseResult.tools) {
      const icon = tool.status === 'OK' ? '✅' : tool.status === 'WARN' ? '⚠️' : '❌';
      console.log(`[${icon}] ${tool.name}: ${tool.status}`);

      if (tool.issues && tool.issues.length > 0) {
        for (const issue of tool.issues) {
          console.log(`   - ${issue}`);
        }
      }
    }

    console.log('\n--- JSON Output ---\n');
    console.log(JSON.stringify(diagnoseResult, null, 2));

    return diagnoseResult;
  }

  async executeTask(task) {
    console.log(`🔧 执行任务: ${task}\n`);

    const doctorResult = await this.runDoctor();

    if (doctorResult.overallStatus !== 'OK') {
      console.log('\n⚠️ 检测到环境问题，开始修复...\n');

      for (const tool of doctorResult.tools) {
        if (tool.status !== 'OK') {
          console.log(`修复 ${tool.name}...`);
          await this.fix(tool.name);
        }
      }

      console.log('\n🔄 重新检测...\n');
      await this.runDoctor();
    }

    console.log('\n✅ 环境就绪，可以开始任务');
  }
}

const agent = new DevEnvAgent();

const args = process.argv.slice(2);
const command = args[0] || 'doctor';

async function main() {
  switch (command) {
    case 'doctor':
    case 'diagnose':
      await agent.runDoctor();
      break;
    case 'fix':
      const tool = args[1];
      if (tool) {
        const result = await agent.fix(tool);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('Usage: node agent/index.js fix <tool>');
        console.log('Tools: nodejs, python, go, rust, docker');
      }
      break;
    case 'setup':
      const setupResult = await agent.setupAll();
      console.log(JSON.stringify(setupResult, null, 2));
      break;
    case 'list':
      console.log('Available skills:');
      listSkills().forEach(s => console.log(`  - ${s}`));
      break;
    default:
      console.log('Usage: node agent/index.js <command>');
      console.log('Commands:');
      console.log('  doctor/diagnose  - 运行健康检查');
      console.log('  fix <tool>      - 修复指定工具');
      console.log('  setup           - 一键配置所有环境');
      console.log('  list            - 列出所有技能');
  }
}

main().catch(console.error);

module.exports = agent;
module.exports.DevEnvAgent = DevEnvAgent;
