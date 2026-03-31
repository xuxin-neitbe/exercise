#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const checks = [];

function checkNodeVersion() {
    try {
        let pkgJson;
        try {
            pkgJson = require('./package.json');
        } catch {
            pkgJson = require('../package.json');
        }
        const expectedVersion = pkgJson.volta?.node || '20';
        const currentVersion = execSync('node -v', { encoding: 'utf8' }).trim().replace('v', '');

        const currentMajor = parseInt(currentVersion.split('.')[0]);
        const expectedMajor = parseInt(expectedVersion.split('.')[0]);

        if (currentMajor === expectedMajor || currentMajor >= 20) {
            checks.push({
                name: 'Node.js Version',
                status: 'OK',
                message: `v${currentVersion}`,
                suggestion: null
            });
        } else {
            checks.push({
                name: 'Node.js Version',
                status: 'WARN',
                message: `当前: v${currentVersion}, 预期: ${expectedVersion}+`,
                suggestion: `运行 'volta pin node@${expectedVersion}' 锁定版本`
            });
        }
    } catch (e) {
        checks.push({
            name: 'Node.js Version',
            status: 'CRITICAL',
            message: 'Node.js 未安装',
            suggestion: '安装 Node.js'
        });
    }
}

function checkDependencies() {
    try {
        execSync('npm install --package-lock-only --ignore-scripts', { stdio: 'ignore' });
        checks.push({
            name: 'Dependencies',
            status: 'OK',
            message: '已同步',
            suggestion: null
        });
    } catch (e) {
        checks.push({
            name: 'Dependencies',
            status: 'CRITICAL',
            message: 'package-lock.json 与 package.json 不同步!',
            suggestion: "运行 'npm install' 来更新依赖"
        });
    }
}

function checkDocker() {
    try {
        execSync('docker info', { stdio: 'ignore' });
        checks.push({
            name: 'Docker Service',
            status: 'OK',
            message: '已运行',
            suggestion: null
        });
    } catch (e) {
        checks.push({
            name: 'Docker Service',
            status: 'WARN',
            message: '未运行',
            suggestion: '启动 Docker Desktop'
        });
    }
}

function checkGit() {
    try {
        execSync('git status', { stdio: 'ignore' });
        checks.push({
            name: 'Git Repository',
            status: 'OK',
            message: '已初始化',
            suggestion: null
        });
    } catch (e) {
        checks.push({
            name: 'Git Repository',
            status: 'WARN',
            message: '未初始化',
            suggestion: '运行 git init'
        });
    }
}

console.log('🩺 环境健康检查...\n');

checkNodeVersion();
checkDependencies();
checkDocker();
checkGit();

const hasCritical = checks.some(c => c.status === 'CRITICAL');
const hasWarn = checks.some(c => c.status === 'WARN');

checks.forEach(check => {
    const icon = check.status === 'OK' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
    const color = check.status === 'OK' ? 'green' : check.status === 'WARN' ? 'yellow' : 'red';

    if (!jsonMode) {
        console.log(chalk[color](`[${icon}] ${check.name}: ${check.message}`));
        if (check.suggestion) {
            console.log(chalk.gray(`   - 建议: ${check.suggestion}`));
        }
    }
});

const result = {
    status: hasCritical ? 'CRITICAL' : hasWarn ? 'WARN' : 'OK',
    checks: checks
};

if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
} else {
    console.log('\n--- JSON Output ---\n');
    console.log(JSON.stringify(result, null, 2));
}

process.exit(hasCritical ? 1 : 0);