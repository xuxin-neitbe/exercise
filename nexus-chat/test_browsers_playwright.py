"""
Playwright 三款浏览器调用测试脚本
测试 Edge、Firefox、华为浏览器是否可正常调用
"""

from playwright.sync_api import sync_playwright
import sys

# 浏览器配置
BROWSERS = {
    'Edge': {
        'type': 'channel',
        'channel': 'msedge',
        'executable': None
    },
    'Firefox': {
        'type': 'builtin',
        'browser_type': 'firefox',
        'executable': None
    },
    'Huawei': {
        'type': 'executable',
        'executable': r'C:\Program Files\Huawei\Browser\HuaweiBrowser.exe'
    }
}

def test_browser(name: str, config: dict, p) -> bool:
    """测试单个浏览器是否可正常调用"""
    print(f'\n{"="*50}')
    print(f'测试浏览器: {name}')
    print(f'配置: {config}')
    print(f'{"="*50}')
    
    try:
        browser = None
        
        if config['type'] == 'channel':
            # 使用 channel 方式启动 (Edge)
            browser = p.chromium.launch(
                channel=config['channel'],
                headless=False
            )
        elif config['type'] == 'builtin':
            # 使用内置浏览器类型 (Firefox)
            browser_type = getattr(p, config['browser_type'])
            browser = browser_type.launch(headless=False)
        elif config['type'] == 'executable':
            # 使用可执行文件路径启动 (华为浏览器)
            browser = p.chromium.launch(
                executable_path=config['executable'],
                headless=False
            )
        
        # 创建页面并访问测试网站
        page = browser.new_page()
        page.goto('https://www.baidu.com', timeout=30000)
        page.wait_for_load_state('networkidle')
        
        # 获取页面标题
        title = page.title()
        print(f'✅ {name} 测试成功!')
        print(f'   页面标题: {title}')
        
        # 截图保存
        screenshot_path = f'test_{name.lower()}_screenshot.png'
        page.screenshot(path=screenshot_path)
        print(f'   截图已保存: {screenshot_path}')
        
        browser.close()
        return True
        
    except Exception as e:
        print(f'❌ {name} 测试失败!')
        print(f'   错误信息: {str(e)}')
        if browser:
            try:
                browser.close()
            except:
                pass
        return False

def main():
    """主测试函数"""
    print('开始 Playwright 浏览器调用测试')
    print(f'Playwright 版本: 检测中...')
    
    results = {}
    
    with sync_playwright() as p:
        for name, config in BROWSERS.items():
            success = test_browser(name, config, p)
            results[name] = '✅ 成功' if success else '❌ 失败'
    
    # 输出测试结果汇总
    print(f'\n{"="*50}')
    print('测试结果汇总:')
    print(f'{"="*50}')
    for name, result in results.items():
        print(f'  {name}: {result}')
    
    # 返回退出码
    all_success = all('成功' in r for r in results.values())
    return 0 if all_success else 1

if __name__ == '__main__':
    sys.exit(main())
