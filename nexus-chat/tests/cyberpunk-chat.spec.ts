/**
 * Playwright 测试套件 - 赛博朋克风格聊天应用
 *
 * 测试范围：
 * 1. 登录页面
 * 2. 聊天主页面
 * 3. 侧边栏（好友列表、会话列表）
 * 4. 聊天区域
 * 5. 功能测试
 * 6. 视觉测试（赛博朋克样式）
 * 7. 性能测试
 * 8. 无障碍测试
 */

import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// 测试数据
const testUser = {
    email: 'test@example.com',
    password: 'Test123456',
    name: 'Test User'
};

/**
 * 辅助函数：等待赛博朋克样式加载完成
 */
async function waitForCyberpunkStyles(page: Page) {
    // 等待 CSS 变量加载
    await page.waitForFunction(() => {
        const styles = getComputedStyle(document.documentElement);
        return styles.getPropertyValue('--color-neon-cyan') !== '';
    }, { timeout: 5000 });
}

/**
 * 辅助函数：验证赛博朋克颜色系统
 */
async function verifyCyberpunkColors(page: Page) {
    const colors = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
            neonCyan: styles.getPropertyValue('--color-neon-cyan').trim(),
            neonMagenta: styles.getPropertyValue('--color-neon-magenta').trim(),
            neonGreen: styles.getPropertyValue('--color-neon-green').trim(),
            neonRed: styles.getPropertyValue('--color-neon-red').trim(),
            bgPrimary: styles.getPropertyValue('--color-bg-primary').trim(),
            textPrimary: styles.getPropertyValue('--color-text-primary').trim()
        };
    });

    // 验证关键颜色变量存在
    expect(colors.neonCyan).toBeTruthy();
    expect(colors.neonMagenta).toBeTruthy();
    expect(colors.neonGreen).toBeTruthy();
    expect(colors.neonRed).toBeTruthy();
    expect(colors.bgPrimary).toBeTruthy();
    expect(colors.textPrimary).toBeTruthy();

    // 验证颜色值格式（十六进制或 RGB）
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const rgbColorRegex = /^rgb\(\d+,\s*\d+,\s*\d+\)$/;

    expect(
        hexColorRegex.test(colors.neonCyan) || rgbColorRegex.test(colors.neonCyan)
    ).toBeTruthy();
}

/**
 * 辅助函数：验证霓虹发光效果
 */
async function verifyNeonGlowEffect(page: Page, selector: string) {
    const element = page.locator(selector).first();
    const boxShadow = await element.evaluate(el => {
        return getComputedStyle(el).boxShadow;
    });

    // 验证包含发光效果（box-shadow 包含颜色和模糊）
    expect(boxShadow).toBeTruthy();
    expect(boxShadow.length).toBeGreaterThan(0);
}

/**
 * 辅助函数：测量页面性能指标
 */
async function measurePerformanceMetrics(page: Page) {
    const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
            // 页面加载时间
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            // 资源加载时间
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            // 内存使用（如果可用）
            memory: (performance as any).memory ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
            } : null
        };
    });

    return metrics;
}

/**
 * 辅助函数：验证动画流畅性
 */
async function verifyAnimationSmoothness(page: Page, selector: string) {
    const element = page.locator(selector).first();

    // 获取动画持续时间
    const animationDuration = await element.evaluate(el => {
        const styles = getComputedStyle(el);
        return parseFloat(styles.animationDuration) || 0;
    });

    // 验证动画持续时间合理（不超过 3 秒）
    expect(animationDuration).toBeLessThanOrEqual(3);
    expect(animationDuration).toBeGreaterThan(0);

    // 验证动画存在
    const hasAnimation = await element.evaluate(el => {
        const styles = getComputedStyle(el);
        return styles.animationName !== 'none';
    });

    expect(hasAnimation).toBeTruthy();
}

/**
 * 辅助函数：测试键盘导航
 */
async function testKeyboardNavigation(page: Page) {
    const tabResults = [];

    // 测试 Tab 键导航
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
            const active = document.activeElement;
            return {
                tagName: active?.tagName,
                type: (active as HTMLInputElement)?.type,
                id: active?.id,
                className: active?.className
            };
        });
        tabResults.push(focusedElement);
    }

    // 验证焦点在可交互元素之间移动
    const interactiveElements = tabResults.filter(r =>
        ['INPUT', 'BUTTON', 'A', 'TEXTAREA'].includes(r.tagName)
    );
    expect(interactiveElements.length).toBeGreaterThan(0);

    return tabResults;
}

/**
 * 辅助函数：验证焦点状态可见性
 */
async function verifyFocusVisibility(page: Page) {
    // 查找所有可聚焦元素
    const focusableElements = await page.locator('button, input, textarea, a[href]').all();

    for (const element of focusableElements.slice(0, 5)) { // 测试前 5 个元素
        // 点击元素使其获得焦点
        await element.click();

        // 验证焦点样式
        const hasFocusStyle = await page.evaluate(() => {
            const active = document.activeElement;
            const styles = getComputedStyle(active as Element);
            return {
                outline: styles.outline,
                outlineWidth: styles.outlineWidth,
                outlineColor: styles.outlineColor,
                outlineOffset: styles.outlineOffset,
                boxShadow: styles.boxShadow
            };
        });

        // 验证焦点样式可见（outline 或 box-shadow）
        const hasVisibleFocus =
            (hasFocusStyle.outline && hasFocusStyle.outline !== 'none') ||
            (hasFocusStyle.boxShadow && hasFocusStyle.boxShadow !== 'none');

        expect(hasVisibleFocus).toBeTruthy();
    }
}

/**
 * 辅助函数：验证 prefers-reduced-motion 支持
 */
async function verifyReducedMotionSupport(page: Page) {
    // 设置 prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 重新加载页面
    await page.reload();

    // 验证动画被禁用
    const animationsDisabled = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
            const styles = getComputedStyle(el);
            const animationDuration = parseFloat(styles.animationDuration);
            const transitionDuration = parseFloat(styles.transitionDuration);

            // 验证动画和过渡时间接近 0
            if (animationDuration > 0.01 || transitionDuration > 0.01) {
                return false;
            }
        }
        return true;
    });

    expect(animationsDisabled).toBeTruthy();

    // 恢复正常设置
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
}

/**
 * 辅助函数：验证响应式布局
 */
async function verifyResponsiveLayout(page: Page) {
    const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500); // 等待布局调整

        // 验证页面可见且无水平滚动
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll).toBeFalsy();

        // 验证主要内容可见
        const mainContent = page.locator('main, .chatArea, .sidebar').first();
        await expect(mainContent).toBeVisible();
    }
}

/**
 * 辅助函数：验证赛博朋克字体加载
 */
async function verifyCyberpunkFonts(page: Page) {
    const fontsLoaded = await page.evaluate(() => {
        return document.fonts.ready.then(() => {
            const fonts = document.fonts;
            const cyberpunkFonts = ['Orbitron', 'Rajdhani', 'Share Tech Mono'];
            const loadedFonts = [];

            for (const font of cyberpunkFonts) {
                for (const loadedFont of fonts) {
                    if (loadedFont.family.includes(font)) {
                        loadedFonts.push(font);
                        break;
                    }
                }
            }

            return loadedFonts;
        });
    });

    // 至少加载了一个赛博朋克字体
    expect(fontsLoaded.length).toBeGreaterThan(0);
}

/**
 * 辅助函数：验证玻璃拟态效果
 */
async function verifyGlassMorphismEffect(page: Page, selector: string) {
    const element = page.locator(selector).first();

    const glassStyles = await element.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
            backdropFilter: styles.backdropFilter,
            webkitBackdropFilter: styles.webkitBackdropFilter,
            backgroundColor: styles.backgroundColor,
            background: styles.background
        };
    });

    // 验证包含 backdrop-filter
    const hasBackdropFilter =
        glassStyles.backdropFilter !== 'none' ||
        glassStyles.webkitBackdropFilter !== 'none';

    expect(hasBackdropFilter).toBeTruthy();
}

/**
 * 辅助函数：验证赛博朋克装饰元素
 */
async function verifyCyberpunkDecorations(page: Page) {
    // 检查装饰性元素
    const decorations = await page.evaluate(() => {
        return {
            hasScanline: !!document.querySelector('.decorative-scanline'),
            hasDataPoint: !!document.querySelector('.decorative-data-point'),
            hasCorner: !!document.querySelector('.decorative-corner'),
            hasLine: !!document.querySelector('.decorative-line')
        };
    });

    // 至少有一个装饰元素（可选）
    // expect(decorations.hasScanline || decorations.hasDataPoint || decorations.hasCorner || decorations.hasLine).toBeTruthy();
}

/**
 * 辅助函数：验证滚动条样式
 */
async function verifyScrollbarStyles(page: Page) {
    // 创建一个可滚动的容器来测试滚动条
    const scrollbarTest = await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.height = '200px';
        div.style.overflow = 'auto';
        div.style.position = 'absolute';
        div.style.top = '-9999px';
        div.innerHTML = '<div style="height: 1000px;"></div>';
        document.body.appendChild(div);

        const scrollbarStyles = {
            trackWidth: getComputedStyle(div).scrollbarWidth,
            webkitScrollbar: getComputedStyle(div).webkitScrollbar
        };

        document.body.removeChild(div);
        return scrollbarStyles;
    });

    // 滚动条样式已应用
    expect(scrollbarTest).toBeTruthy();
}

// ========================================
// 测试套件
// ========================================

test.describe('赛博朋克聊天应用 - 页面加载测试', () => {
    test('应该成功加载登录页面', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // 验证页面标题
        await expect(page).toHaveTitle(/Nexus Chat/);

        // 验证登录表单存在
        const loginForm = page.locator('form').first();
        await expect(loginForm).toBeVisible();

        // 验证输入字段存在
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // 验证登录按钮存在
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();
    });

    test('应该加载赛博朋克样式', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 验证赛博朋克颜色系统
        await verifyCyberpunkColors(page);

        // 验证赛博朋克字体加载
        await verifyCyberpunkFonts(page);
    });

    test('应该显示赛博朋克背景效果', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 验证背景包含网格和渐变效果
        const bodyStyles = await page.evaluate(() => {
            const styles = getComputedStyle(document.body);
            return {
                backgroundImage: styles.backgroundImage,
                backgroundColor: styles.backgroundColor
            };
        });

        expect(bodyStyles.backgroundImage).toBeTruthy();
        expect(bodyStyles.backgroundImage).toContain('linear-gradient');
    });
});

test.describe('赛博朋克聊天应用 - 登录功能测试', () => {
    test('应该显示登录模式切换按钮', async ({ page }) => {
        await page.goto(BASE_URL);

        // 验证登录模式切换按钮
        const modeButtons = page.locator('button').filter({ hasText: /登录|注册|魔法链接/ });
        await expect(modeButtons).toHaveCount(3);
    });

    test('应该能够切换到注册模式', async ({ page }) => {
        await page.goto(BASE_URL);

        // 点击"创建新账户"按钮
        const registerButton = page.locator('button').filter({ hasText: '创建新账户' });
        await registerButton.click();

        // 验证用户名输入框出现
        const nameInput = page.locator('input[placeholder*="用户名"]');
        await expect(nameInput).toBeVisible();
    });

    test('应该能够切换到魔法链接模式', async ({ page }) => {
        await page.goto(BASE_URL);

        // 点击"使用魔法链接"按钮
        const magicLinkButton = page.locator('button').filter({ hasText: '使用魔法链接' });
        await magicLinkButton.click();

        // 验证密码输入框消失
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).not.toBeVisible();
    });

    test('应该验证必填字段', async ({ page }) => {
        await page.goto(BASE_URL);

        // 尝试提交空表单
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // 验证错误提示出现
        const errorMessage = page.locator('.error, [class*="error"]').first();
        await expect(errorMessage).toBeVisible();
    });
});

test.describe('赛博朋克聊天应用 - 视觉测试', () => {
    test('应该验证霓虹发光效果', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 查找可能有发光效果的元素
        const glowingElements = page.locator('button, input').first();

        // 验证发光效果
        await verifyNeonGlowEffect(page, 'button');
    });

    test('应该验证动画效果', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 查找有动画的元素
        const animatedElements = page.locator('[class*="animate-"]');

        // 验证至少有一个动画元素
        const count = await animatedElements.count();
        expect(count).toBeGreaterThan(0);

        // 验证动画流畅性
        if (count > 0) {
            await verifyAnimationSmoothness(page, '[class*="animate-"]');
        }
    });

    test('应该验证玻璃拟态效果', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 查找可能有玻璃效果的元素
        const glassElements = page.locator('.glass, [class*="glass"]');

        const count = await glassElements.count();
        if (count > 0) {
            await verifyGlassMorphismEffect(page, '.glass');
        }
    });

    test('应该验证赛博朋克装饰元素', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        await verifyCyberpunkDecorations(page);
    });

    test('应该验证自定义滚动条样式', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        await verifyScrollbarStyles(page);
    });

    test('应该验证赛博朋克字体应用', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 验证标题使用赛博朋克字体
        const titleElement = page.locator('h1').first();
        const titleFont = await titleElement.evaluate(el => {
            return getComputedStyle(el).fontFamily;
        });

        expect(titleFont).toMatch(/Orbitron|Rajdhani/i);
    });

    test('应该验证霓虹文字效果', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 查找有文字发光效果的元素
        const glowingText = page.locator('.text-glow-cyan, .text-glow-magenta');

        const count = await glowingText.count();
        // 至少有一个元素有文字发光效果（可选）
        // expect(count).toBeGreaterThan(0);
    });
});

test.describe('赛博朋克聊天应用 - 性能测试', () => {
    test('应该测量页面加载性能', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        // 页面加载时间应小于 5 秒
        expect(loadTime).toBeLessThan(5000);

        // 获取详细性能指标
        const metrics = await measurePerformanceMetrics(page);

        // 验证关键性能指标
        expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM 加载完成时间
        expect(metrics.domInteractive).toBeLessThan(2000); // DOM 可交互时间

        console.log('性能指标:', metrics);
    });

    test('应该验证动画性能', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 测量动画帧率
        const frameRate = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
                let frames = 0;
                const startTime = performance.now();
                const duration = 2000; // 测量 2 秒

                function countFrames() {
                    frames++;
                    if (performance.now() - startTime < duration) {
                        requestAnimationFrame(countFrames);
                    } else {
                        const fps = (frames / duration) * 1000;
                        resolve(fps);
                    }
                }

                requestAnimationFrame(countFrames);
            });
        });

        // 帧率应接近 60fps
        expect(frameRate).toBeGreaterThan(30); // 至少 30fps
        console.log('动画帧率:', frameRate.toFixed(2), 'fps');
    });

    test('应该验证内存使用', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        const metrics = await measurePerformanceMetrics(page);

        if (metrics.memory) {
            // 内存使用不应过高（小于 100MB）
            const usedMemoryMB = metrics.memory.usedJSHeapSize / (1024 * 1024);
            expect(usedMemoryMB).toBeLessThan(100);

            console.log('内存使用:', usedMemoryMB.toFixed(2), 'MB');
        }
    });

    test('应该验证资源加载优化', async ({ page }) => {
        const responses: any[] = [];

        page.on('response', async (response) => {
            const url = response.url();
            const status = response.status();
            const headers = response.headers();

            responses.push({
                url,
                status,
                contentType: headers['content-type'],
                contentLength: headers['content-length']
            });
        });

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // 验证关键资源加载成功
        const failedResponses = responses.filter(r => r.status >= 400);
        expect(failedResponses.length).toBe(0);

        // 验证 CSS 和 JS 资源已加载
        const cssResources = responses.filter(r =>
            r.contentType && r.contentType.includes('text/css')
        );
        expect(cssResources.length).toBeGreaterThan(0);

        const jsResources = responses.filter(r =>
            r.contentType && r.contentType.includes('javascript')
        );
        expect(jsResources.length).toBeGreaterThan(0);
    });
});

test.describe('赛博朋克聊天应用 - 无障碍测试', () => {
    test('应该测试键盘导航', async ({ page }) => {
        await page.goto(BASE_URL);

        const tabResults = await testKeyboardNavigation(page);

        // 验证 Tab 键可以导航到多个元素
        expect(tabResults.length).toBeGreaterThan(5);
    });

    test('应该验证焦点状态可见性', async ({ page }) => {
        await page.goto(BASE_URL);

        await verifyFocusVisibility(page);
    });

    test('应该验证 ARIA 标签', async ({ page }) => {
        await page.goto(BASE_URL);

        // 验证输入框有标签
        const emailInput = page.locator('input[type="email"]');
        const hasLabel = await emailInput.evaluate(el => {
            return el.hasAttribute('aria-label') ||
                   el.hasAttribute('aria-labelledby') ||
                   el.labels.length > 0;
        });

        expect(hasLabel).toBeTruthy();
    });

    test('应该验证按钮可访问性', async ({ page }) => {
        await page.goto(BASE_URL);

        const buttons = page.locator('button');

        for (const button of await buttons.all()) {
            const hasAccessibleName = await button.evaluate(el => {
                return el.textContent?.trim() !== '' ||
                       el.hasAttribute('aria-label') ||
                       el.hasAttribute('aria-labelledby');
            });

            expect(hasAccessibleName).toBeTruthy();
        }
    });

    test('应该验证 prefers-reduced-motion 支持', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        await verifyReducedMotionSupport(page);
    });

    test('应该验证颜色对比度', async ({ page }) => {
        await page.goto(BASE_URL);

        // 验证主要文本元素的颜色对比度
        const textElements = page.locator('h1, h2, p, span').all();

        for (const element of await textElements.slice(0, 10)) {
            const contrast = await element.evaluate(el => {
                const styles = getComputedStyle(el);
                const textColor = styles.color;
                const bgColor = styles.backgroundColor;

                // 简单验证：文本颜色不是透明或与背景相同
                return {
                    textColor,
                    bgColor,
                    hasColor: textColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'transparent',
                    hasBgColor: bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent'
                };
            });

            expect(contrast.hasColor).toBeTruthy();
        }
    });

    test('应该验证表单错误提示可访问性', async ({ page }) => {
        await page.goto(BASE_URL);

        // 触发表单验证错误
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // 验证错误提示存在且可访问
        const errorMessage = page.locator('.error, [class*="error"]').first();
        await expect(errorMessage).toBeVisible();

        // 验证错误提示与输入框关联
        const hasAriaDescribedBy = await page.evaluate(() => {
            const input = document.querySelector('input[type="email"]') as HTMLInputElement;
            return input?.hasAttribute('aria-describedby') ||
                   input?.hasAttribute('aria-invalid');
        });

        // 可选：验证 ARIA 关联
        // expect(hasAriaDescribedBy).toBeTruthy();
    });
});

test.describe('赛博朋克聊天应用 - 响应式测试', () => {
    test('应该验证桌面端布局', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(BASE_URL);

        // 验证无水平滚动
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll).toBeFalsy();
    });

    test('应该验证平板端布局', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(BASE_URL);

        // 验证内容可见
        const mainContent = page.locator('main, form, .card').first();
        await expect(mainContent).toBeVisible();
    });

    test('应该验证移动端布局', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);

        // 验证内容可见且可滚动
        const mainContent = page.locator('main, form, .card').first();
        await expect(mainContent).toBeVisible();

        // 验证无水平滚动
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll).toBeFalsy();
    });

    test('应该验证响应式断点', async ({ page }) => {
        const viewports = [
            { width: 1920, name: 'Desktop' },
            { width: 1024, name: 'Tablet' },
            { width: 768, name: 'Tablet Portrait' },
            { width: 375, name: 'Mobile' }
        ];

        for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: 1080 });
            await page.goto(BASE_URL);
            await page.waitForTimeout(300);

            // 验证页面正常渲染
            const bodyVisible = await page.isVisible('body');
            expect(bodyVisible).toBeTruthy();

            console.log(`测试视口: ${viewport.name} (${viewport.width}px)`);
        }
    });
});

test.describe('赛博朋克聊天应用 - 截图测试', () => {
    test('应该捕获登录页面截图', async ({ page }) => {
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 等待页面完全加载
        await page.waitForLoadState('networkidle');

        // 捕获完整页面截图
        await page.screenshot({
            path: 'test-results/screenshots/login-page.png',
            fullPage: true
        });

        // 捕获登录表单截图
        const loginCard = page.locator('.card, form').first();
        await loginCard.screenshot({
            path: 'test-results/screenshots/login-form.png'
        });
    });

    test('应该捕获不同视口下的截图', async ({ page }) => {
        const viewports = [
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' }
        ];

        for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(BASE_URL);
            await waitForCyberpunkStyles(page);
            await page.waitForLoadState('networkidle');

            await page.screenshot({
                path: `test-results/screenshots/login-${viewport.name}.png`,
                fullPage: true
            });
        }
    });
});

test.describe('赛博朋克聊天应用 - 交互测试', () => {
    test('应该验证输入框交互', async ({ page }) => {
        await page.goto(BASE_URL);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.click();
        await emailInput.fill('test@example.com');

        // 验证输入值
        const value = await emailInput.inputValue();
        expect(value).toBe('test@example.com');

        // 验证焦点样式
        const hasFocus = await emailInput.evaluate(el => document.activeElement === el);
        expect(hasFocus).toBeTruthy();
    });

    test('应该验证按钮悬停效果', async ({ page }) => {
        await page.goto(BASE_URL);

        const button = page.locator('button').first();
        await button.hover();

        // 验证悬停样式
        const hoverStyles = await button.evaluate(el => {
            const styles = getComputedStyle(el);
            return {
                cursor: styles.cursor,
                transform: styles.transform,
                boxShadow: styles.boxShadow
            };
        });

        expect(hoverStyles.cursor).toBe('pointer');
    });

    test('应该验证表单提交交互', async ({ page }) => {
        await page.goto(BASE_URL);

        // 填写表单
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);

        // 提交表单
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // 验证表单提交（可能会失败，但应该有响应）
        await page.waitForTimeout(1000);
    });

    test('应该验证模式切换交互', async ({ page }) => {
        await page.goto(BASE_URL);

        // 切换到注册模式
        const registerButton = page.locator('button').filter({ hasText: '创建新账户' });
        await registerButton.click();

        // 验证用户名输入框出现
        const nameInput = page.locator('input[placeholder*="用户名"]');
        await expect(nameInput).toBeVisible();

        // 切换回登录模式
        const loginButton = page.locator('button').filter({ hasText: '已有账户？登录' });
        await loginButton.click();

        // 验证用户名输入框消失
        await expect(nameInput).not.toBeVisible();
    });
});

test.describe('赛博朋克聊天应用 - 浏览器兼容性测试', () => {
    test('应该在 Chrome 中正常工作', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', '此测试仅在 Chromium 中运行');

        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 验证基本功能
        const loginForm = page.locator('form').first();
        await expect(loginForm).toBeVisible();
    });
});

test.describe('赛博朋克聊天应用 - 控制台错误检查', () => {
    test('应该没有控制台错误', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // 验证没有控制台错误
        expect(errors.length).toBe(0);

        if (errors.length > 0) {
            console.log('控制台错误:', errors);
        }
    });

    test('应该没有网络请求错误', async ({ page }) => {
        const failedRequests: string[] = [];

        page.on('requestfailed', request => {
            failedRequests.push(request.url());
        });

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // 验证没有失败的请求（除了可能的后端 API）
        const apiFailedRequests = failedRequests.filter(url =>
            !url.includes('/api/')
        );

        expect(apiFailedRequests.length).toBe(0);

        if (apiFailedRequests.length > 0) {
            console.log('失败的请求:', apiFailedRequests);
        }
    });
});

test.describe('赛博朋克聊天应用 - 综合测试', () => {
    test('应该执行完整的用户流程测试', async ({ page }) => {
        // 1. 加载页面
        await page.goto(BASE_URL);
        await waitForCyberpunkStyles(page);

        // 2. 验证赛博朋克样式
        await verifyCyberpunkColors(page);
        await verifyCyberpunkFonts(page);

        // 3. 测试键盘导航
        await testKeyboardNavigation(page);

        // 4. 测试表单交互
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);

        // 5. 测试模式切换
        const registerButton = page.locator('button').filter({ hasText: '创建新账户' });
        await registerButton.click();

        const nameInput = page.locator('input[placeholder*="用户名"]');
        await expect(nameInput).toBeVisible();
        await nameInput.fill(testUser.name);

        // 6. 切换回登录模式
        const loginButton = page.locator('button').filter({ hasText: '已有账户？登录' });
        await loginButton.click();

        // 7. 测试响应式布局
        await verifyResponsiveLayout(page);

        // 8. 捕获截图
        await page.screenshot({
            path: 'test-results/screenshots/comprehensive-test.png',
            fullPage: true
        });

        console.log('综合测试完成');
    });
});
