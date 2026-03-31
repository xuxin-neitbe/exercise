/**
 * 浏览器配置模块 - 统一管理三款浏览器的调用
 * 
 * 使用方法:
 *   const { launchBrowser, runOnAllBrowsers } = require('./browser-config.js');
 *   
 *   // 启动 Edge
 *   const edge = await launchBrowser('edge');
 *   
 *   // 在所有浏览器上运行测试
 *   await runOnAllBrowsers(async (browser, name) => {
 *     const page = await browser.newPage();
 *     await page.goto('https://example.com');
 *   });
 */

const { chromium, firefox } = require('playwright');

// 浏览器配置
const BROWSER_CONFIGS = {
  edge: {
    name: 'Microsoft Edge',
    type: 'chromium',
    launchOptions: {
      channel: 'msedge',
      headless: false,
    },
  },
  firefox: {
    name: 'Mozilla Firefox',
    type: 'firefox',
    launchOptions: {
      headless: false,
    },
  },
  huawei: {
    name: '华为浏览器',
    type: 'chromium',
    launchOptions: {
      executablePath: 'C:\\Program Files\\Huawei\\Browser\\HuaweiBrowser.exe',
      headless: false,
    },
  },
};

/**
 * 启动指定浏览器
 * @param {string} browserName - 浏览器名称: 'edge' | 'firefox' | 'huawei'
 * @param {object} extraOptions - 额外的启动选项 (会覆盖默认配置)
 * @returns {Promise<Browser>} Playwright Browser 实例
 */
async function launchBrowser(browserName, extraOptions = {}) {
  const config = BROWSER_CONFIGS[browserName.toLowerCase()];
  
  if (!config) {
    throw new Error(`不支持的浏览器: ${browserName}。支持的浏览器: ${Object.keys(BROWSER_CONFIGS).join(', ')}`);
  }

  // 合并启动选项
  const launchOptions = {
    ...config.launchOptions,
    ...extraOptions,
  };

  // 根据浏览器类型选择启动器
  const browserType = config.type === 'firefox' ? firefox : chromium;
  
  console.log(`正在启动 ${config.name}...`);
  const browser = await browserType.launch(launchOptions);
  console.log(`${config.name} 启动成功`);
  
  return browser;
}

/**
 * 获取所有支持的浏览器名称
 * @returns {string[]} 浏览器名称列表
 */
function getSupportedBrowsers() {
  return Object.keys(BROWSER_CONFIGS);
}

/**
 * 批量启动多个浏览器
 * @param {string[]} browserNames - 浏览器名称数组
 * @param {object} extraOptions - 额外的启动选项
 * @returns {Promise<Map<string, Browser>>} 浏览器名称到 Browser 实例的映射
 */
async function launchBrowsers(browserNames, extraOptions = {}) {
  const browsers = new Map();
  
  for (const name of browserNames) {
    try {
      const browser = await launchBrowser(name, extraOptions);
      browsers.set(name, browser);
    } catch (error) {
      console.error(`启动 ${name} 失败: ${error.message}`);
      browsers.set(name, null);
    }
  }
  
  return browsers;
}

/**
 * 在所有浏览器上运行测试
 * @param {Function} testFn - 测试函数，接收 (browser, browserName) 参数
 * @param {object} options - 选项
 * @param {string[]} options.browsers - 要测试的浏览器列表
 * @param {boolean} options.parallel - 是否并行运行 (默认 false)
 */
async function runOnAllBrowsers(testFn, options = {}) {
  const { browsers = Object.keys(BROWSER_CONFIGS), parallel = false } = options;
  
  if (parallel) {
    // 并行运行
    const promises = browsers.map(async (name) => {
      const browser = await launchBrowser(name);
      try {
        await testFn(browser, name);
      } finally {
        await browser.close();
      }
    });
    await Promise.all(promises);
  } else {
    // 顺序运行
    for (const name of browsers) {
      const browser = await launchBrowser(name);
      try {
        await testFn(browser, name);
      } finally {
        await browser.close();
      }
    }
  }
}

module.exports = {
  BROWSER_CONFIGS,
  launchBrowser,
  launchBrowsers,
  getSupportedBrowsers,
  runOnAllBrowsers,
};
