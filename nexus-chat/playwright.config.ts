import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于测试赛博朋克风格聊天应用
 */
export default defineConfig({
  // 测试目录
  testDir: './tests',

  // 测试超时时间（毫秒）
  timeout: 30000,

  // 测试失败时的超时时间
  expect: {
    timeout: 5000
  },

  // 完全并行运行测试
  fullyParallel: true,

  // 失败时禁止重试（可以设置为 1-3 次重试）
  retries: 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 测试报告配置
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['list']
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 追踪配置（失败时保留追踪）
    trace: 'retain-on-failure',

    // 截图配置（失败时截图）
    screenshot: 'only-on-failure',

    // 视频配置（失败时录制）
    video: 'retain-on-failure',

    // 浏览器视口大小
    viewport: { width: 1280, height: 720 },

    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,

    // 操作超时时间
    actionTimeout: 10000,

    // 导航超时时间
    navigationTimeout: 30000,

    // 用户代理
    userAgent: 'Playwright Test - Cyberpunk Chat',

    // 等待网络空闲状态
    // waitUntil: 'networkidle',

    // 额外的 HTTP 头
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },

    // 启用截图时的反锯齿
    deviceScaleFactor: 1
  },

  // 项目配置（不同浏览器和设备）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动设备测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // 平板设备测试
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },

    // 响应式测试
    {
      name: 'Desktop - 1920x1080',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'Desktop - 1366x768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },

    {
      name: 'Mobile - 375x667',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 }
      },
    },

    {
      name: 'Mobile - 414x896',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 414, height: 896 }
      },
    },

    // 无障碍测试
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // 模拟屏幕阅读器
        // reducedMotion: 'reduce'
      },
    },

    // 性能测试
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        // 启用性能追踪
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--js-flags=--expose-gc'
          ]
        }
      },
    }
  ],

  // 开发服务器配置（如果需要）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },

  // 输出目录
  outputDir: 'test-results',

  // 全局设置文件
  // globalSetup: require.resolve('./tests/global-setup'),
  // globalTeardown: require.resolve('./tests/global-teardown'),
});
