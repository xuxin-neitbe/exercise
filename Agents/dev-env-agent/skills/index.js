const fs = require('fs');
const path = require('path');

class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this.loaded = false;
  }

  load() {
    if (this.loaded) return;

    const skillsDir = path.join(__dirname);
    const categories = fs.readdirSync(skillsDir).filter(f => {
      return fs.statSync(path.join(skillsDir, f)).isDirectory() && f !== 'base.js';
    });

    for (const category of categories) {
      const categoryPath = path.join(skillsDir, category);
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        if (file === 'index.js') continue;
        const skillPath = path.join(categoryPath, file);
        const skill = require(skillPath);
        const skillName = `${category}-${file.replace('.js', '')}`;
        this.skills.set(skillName, skill);
      }
    }

    this.loaded = true;
  }

  get(name) {
    this.load();
    return this.skills.get(name);
  }

  list() {
    this.load();
    return Array.from(this.skills.keys());
  }

  async execute(name, params = {}) {
    const skill = this.get(name);
    if (!skill) {
      throw new Error(`Skill not found: ${name}`);
    }

    if (typeof skill.execute === 'function') {
      return await skill.execute(params);
    }

    if (typeof skill === 'function') {
      return await skill(params);
    }

    throw new Error(`Invalid skill: ${name}`);
  }
}

const registry = new SkillRegistry();

module.exports = {
  registry,
  callSkill: (name, params) => registry.execute(name, params),
  listSkills: () => registry.list(),
  getSkill: (name) => registry.get(name)
};
