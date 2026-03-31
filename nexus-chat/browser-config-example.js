/**
 * 浏览器配置模块使用示例
 * 演示如何使用 browser-config.js 模块
 */

const { launchBrowser, launchBrowsers, runOnAllBrowsers, getSupportedBrowsers } = require('./browser-config');

// 示例 1: 单个浏览器测试
async function example1() {
    console.log('\n=== 示例 1: 单个浏览器测试 ===\n');

    const browser = await launchBrowser('edge');
    const page = await browser.newPage();

    await page.goto('https://www.baidu.com');
    console.log('页面标题:', await page.title());

    await browser.close();
}

// 示例 2: 批量启动浏览器
async function example2() {
    console.log('\n=== 示例 2: 批量启动浏览器 ===\n');

    const browsers = await launchBrowsers(['edge', 'firefox', 'huawei']);

    for (const [name, browser] of browsers) {
        if (browser) {
            const page = await browser.newPage();
            await page.goto('https://www.baidu.com');
            console.log(`${name} 页面标题:`, await page.title());
            await browser.close();
        }
    }
}

// 示例 3: 在所有浏览器上运行相同测试
async function example3() {
    console.log('\n=== 示例 3: 在所有浏览器上运行测试 ===\n');

    await runOnAllBrowsers(async (browser, browserName) => {
        const page = await browser.newPage();
        await page.goto('https://www.baidu.com');
        const title = await page.title();
        console.log(`[${browserName}] 页面标题: ${title}`);
        await page.screenshot({ path: `screenshot_${browserName}.png` });
    });
}

// 示例 4: 自定义启动选项
async function example4() {
    console.log('\n=== 示例 4: 自定义启动选项 ===\n');

    // 以无头模式启动
    const browser = await launchBrowser('edge', { headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.baidu.com');
    console.log('无头模式页面标题:', await page.title());

    await browser.close();
}

// 主函数 - 运行所有示例
async function main() {
    console.log('支持的浏览器:', getSupportedBrowsers());

    // 选择要运行的示例 (取消注释相应行)
    await example1();
    // await example2();
    // await example3();
    // await example4();

    console.log('\n测试完成!');
}

main().catch(console.error);
