/**
 * Playwright 三款浏览器调用测试脚本
 * 测试 Edge、Firefox、华为浏览器是否可正常调用
 */

const { chromium, firefox } = require('playwright');

// 浏览器配置
const BROWSERS = {
    Edge: {
        type: 'channel',
        channel: 'msedge',
    },
    Firefox: {
        type: 'builtin',
        browserType: 'firefox',
    },
    Huawei: {
        type: 'executable',
        executablePath: 'C:\\Program Files\\Huawei\\Browser\\HuaweiBrowser.exe',
    }
};

async function testBrowser(name, config) {
    console.log('\n' + '='.repeat(50));
    console.log(`测试浏览器: ${name}`);
    console.log(`配置: ${JSON.stringify(config)}`);
    console.log('='.repeat(50));

    let browser = null;

    try {
        // 根据配置类型选择启动方式
        if (config.type === 'channel') {
            // 使用 channel 方式启动 (Edge)
            browser = await chromium.launch({
                channel: config.channel,
                headless: false,
            });
        } else if (config.type === 'builtin') {
            // 使用内置浏览器类型 (Firefox)
            browser = await firefox.launch({
                headless: false,
            });
        } else if (config.type === 'executable') {
            // 使用可执行文件路径启动 (华为浏览器)
            browser = await chromium.launch({
                executablePath: config.executablePath,
                headless: false,
            });
        }

        // 创建页面并访问测试网站
        const page = await browser.newPage();
        await page.goto('https://www.baidu.com', { timeout: 30000 });
        await page.waitForLoadState('networkidle');

        // 获取页面标题
        const title = await page.title();
        console.log(`✅ ${name} 测试成功!`);
        console.log(`   页面标题: ${title}`);

        // 截图保存
        const screenshotPath = `test_${name.toLowerCase()}_screenshot.png`;
        await page.screenshot({ path: screenshotPath });
        console.log(`   截图已保存: ${screenshotPath}`);

        await browser.close();
        return true;

    } catch (error) {
        console.log(`❌ ${name} 测试失败!`);
        console.log(`   错误信息: ${error.message}`);
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                // 忽略关闭错误
            }
        }
        return false;
    }
}

async function main() {
    console.log('开始 Playwright 浏览器调用测试');

    const results = {};

    // 依次测试每个浏览器
    for (const [name, config] of Object.entries(BROWSERS)) {
        const success = await testBrowser(name, config);
        results[name] = success ? '✅ 成功' : '❌ 失败';
    }

    // 输出测试结果汇总
    console.log('\n' + '='.repeat(50));
    console.log('测试结果汇总:');
    console.log('='.repeat(50));
    for (const [name, result] of Object.entries(results)) {
        console.log(`  ${name}: ${result}`);
    }

    // 检查是否全部成功
    const allSuccess = Object.values(results).every(r => r.includes('成功'));
    process.exit(allSuccess ? 0 : 1);
}

main().catch(console.error);
