---
name: three-browsers
description: 使用 Playwright 调用 Edge、Firefox、华为浏览器进行自动化测试。当用户需要：(1) 在多浏览器上运行测试，(2) 使用 Playwright 启动特定浏览器，(3) 进行跨浏览器兼容性测试，(4) 请求使用 Edge/Firefox/华为浏览器时触发此技能。
license: Complete terms in LICENSE.txt
---

## When to use this skill

使用 Playwright 调用 Edge、Firefox、华为浏览器进行自动化测试时使用此技能：
- 在多浏览器上运行测试
- 使用 Playwright 启动特定浏览器
- 进行跨浏览器兼容性测试
- 请求使用 Edge/Firefox/华为浏览器

## How to use this skill

### 支持的浏览器

| 浏览器 | 名称 | 调用方式 |
|--------|------|----------|
| Edge | `edge` | `channel: 'msedge'` |
| Firefox | `firefox` | 内置 Firefox |
| 华为浏览器 | `huawei` | `executablePath` |

### 方式一：使用配置脚本

```javascript
const { launchBrowser, runOnAllBrowsers } = require('./scripts/browser-config.js');

// 启动单个浏览器
const browser = await launchBrowser('edge');
const page = await browser.newPage();
await page.goto('https://example.com');
await browser.close();

// 在所有浏览器上运行测试
await runOnAllBrowsers(async (browser, name) => {
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(`${name}: ${await page.title()}`);
});
```

### 方式二：直接调用

```javascript
const { chromium, firefox } = require('playwright');

// Edge
const edge = await chromium.launch({ channel: 'msedge', headless: false });

// Firefox
const ff = await firefox.launch({ headless: false });

// 华为浏览器
const huawei = await chromium.launch({
  executablePath: 'C:\\Program Files\\Huawei\\Browser\\HuaweiBrowser.exe',
  headless: false
});
```

## API 参考

### launchBrowser(name, options)

启动指定浏览器。

**参数：**
- `name` - 浏览器名称：`'edge'` | `'firefox'` | `'huawei'`
- `options` - 可选的 Playwright LaunchOptions

**返回：** Playwright Browser 实例

### runOnAllBrowsers(testFn, options)

在所有浏览器上运行测试函数。

**参数：**
- `testFn(browser, browserName)` - 测试函数
- `options.browsers` - 浏览器列表，默认全部
- `options.parallel` - 是否并行运行，默认 false

## 注意事项

1. **华为浏览器** 基于 Chromium，使用 `chromium.launch()` + `executablePath`
2. **Edge** 使用 `channel: 'msedge'` 调用系统安装的 Edge
3. **Firefox** 需要先运行 `npx playwright install firefox`

## Keywords

playwright, browser, edge, firefox, huawei, cross-browser testing, automation
