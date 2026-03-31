const { execSync } = require('child_process');

class BaseSkill {
  constructor(name, config = {}) {
    this.name = name;
    this.description = config.description || '';
    this.version = config.version || '1.0.0';
  }

  exec(command, options = {}) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || 60000,
        ...options
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  execSafe(command, options = {}) {
    const result = this.exec(command, options);
    if (!result.success) {
      throw new Error(`Command failed: ${command}\n${result.error}`);
    }
    return result.output;
  }

  exists(command) {
    try {
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  getVersion(command) {
    try {
      const output = execSync(command, { encoding: 'utf8' });
      return output.trim();
    } catch {
      return null;
    }
  }
}

module.exports = BaseSkill;
