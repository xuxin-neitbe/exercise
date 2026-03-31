/**
 * 使用 three-browsers skill 打开三种浏览器并访问百度
 */

const { launchBrowser } = require('./three-browsers-skill/scripts/browser-config.js');

async function main() {
  console.log('开始启动三种浏览器...');
  
  const browsers = [];
  
  try {
    // 启动 Edge
    console.log('\n=== 启动 Edge ===');
    const edge = await launchBrowser('edge');
    const edgePage = await edge.newPage();
    await edgePage.goto('https://www.baidu.com');
    await edgePage.waitForLoadState('networkidle');
    console.log('Edge 已打开百度，页面标题:', await edgePage.title());
    browsers.push({ name: 'Edge', browser: edge });
    
    // 启动 Firefox
    console.log('\n=== 启动 Firefox ===');
    const firefox = await launchBrowser('firefox');
    const firefoxPage = await firefox.newPage();
    await firefoxPage.goto('https://www.baidu.com');
    await firefoxPage.waitForLoadState('networkidle');
    console.log('Firefox 已打开百度，页面标题:', await firefoxPage.title());
    browsers.push({ name: 'Firefox', browser: firefox });
    
    // 启动华为浏览器
    console.log('\n=== 启动华为浏览器 ===');
    const huawei = await launchBrowser('huawei');
    const huaweiPage = await huawei.newPage();
    await huaweiPage.goto('https://www.baidu.com');
    await huaweiPage.waitForLoadState('networkidle');
    console.log('华为浏览器已打开百度，页面标题:', await huaweiPage.title());
    browsers.push({ name: '华为浏览器', browser: huawei });
    
    console.log('\n=== 所有浏览器已成功打开百度 ===');
    console.log('浏览器将保持打开状态，按 Ctrl+C 关闭...');
    
    // 保持浏览器打开
    await new Promise(() => {});
    
  } catch (error) {
    console.error('发生错误:', error.message);
  } finally {
    // 关闭所有浏览器
    console.log('\n正在关闭所有浏览器...');
    for (const { name, browser } of browsers) {
      try {
        await browser.close();
        console.log(`${name} 已关闭`);
      } catch (e) {
        console.error(`关闭 ${name} 时出错:`, e.message);
      }
    }
  }
}

main().catch(console.error);
