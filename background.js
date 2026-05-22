// 代理控制核心变量（改由内存维护，初始为空，启动时从 storage 加载）
let cachedScheme = 'http';
let cachedHost = '127.0.0.1';
let cachedPort = 2334;
let cachedBypassList = [
    "192.168.0.0/16"
    ,"194.1.0.0/16"
    ,"10.0.0.0/8"
    ,"100.64.0.0/16"
    ,"127.16.0.0/16"
    ,"*baidu.com"
    ,"*163.com"
    ,"*qq.com"
    ,"*jd.com"
    ,"*360.com"
    ,"*hutool.cn"
    ,"*taobao.com"
    ,"*cnblogs.com"
    ,"*csdn.net"
    ,"*gitee.com"
    ,"*bilibili.com"
    ,"*cn"
    ,"*4399.com"
    ,"*51.net"
    ,"*51cto.com"
    ,"*51job.com"
    ,"*58.com"
    ,"*7k7k.com"
    ,"*91.com"
    ,"*alipan.com"
    ,"*alicdn.com"
    ,"*alibaba.com"
    ,"*alibabacloud.com"
    ,"*alipay.com"
    ,"*aliyun.com"
    ,"*biliapi.com"
    ,"*biliapi.net"
    ,"*bilibili.com"
    ,"*bilibili.tv"
    ,"*bilicomic.com"
    ,"*biligame.com"
    ,"*biligame.net"
    ,"*bilivideo.com"
    ,"*douyu.com"
    ,"*hao123.com"
    ,"*huya.com"
    ,"*iqiyi.com"
    ,"*jianshu.*"
    ,"*kuaishou.com"
    ,"*layui.com"
    ,"*qqmail.com"
    ,"*sina.com"
    ,"*sogou.com"
    ,"*taobao.com"
    ,"*tencent-cloud.com"
    ,"*tencent.com"
    ,"*xiaomi.com"
    ,"*zhihu.com"
    ,"*douyin.com"
    ,"*deepseek.com"
    ,"*xunlei.com"
    ,"*weibo.com"
    ,"*postman.co"
    ,"gtool.alal.site"];
let cachedBlockList = []; // 保留供未来黑名单使用

// apply the proxy settings
async function applyProxy() {
    try {
        const config = {
            mode: 'fixed_servers',
            rules: {
                // 动态使用当前内存中的配置值
                singleProxy: {
                    scheme: cachedScheme,
                    host: cachedHost,
                    port: cachedPort
                },
                bypassList: cachedBypassList
            }
        };
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                console.error('set proxy error:', chrome.runtime.lastError.message);
            } else {
                console.info(`proxy applied successfully: ${cachedScheme}://${cachedHost}:${cachedPort}`);
            }
        });
    } catch (err) {
        console.error('apply proxy error:', err);
    }
}

// clear the proxy settings
function clearProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            console.error('clear proxy error:', chrome.runtime.lastError.message);
        } else {
            console.info('clear proxy successfully');
        }
    });
}

// 初始化上下文菜单
chrome.contextMenus.removeAll(() => {
    ['open(Ctrl+Shift+Space)', 'close(Ctrl+Space)','clearHistory'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

// 菜单右键配置
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open(Ctrl+Shift+Space)': applyProxy(); break;
        case 'close(Ctrl+Space)': clearProxy(); break;
        case 'clearHistory': clearHistory(); break;
    }
});

// 清空浏览器访问记录
async function clearHistory() {
    try {
        await chrome.history.deleteAll();
        console.log(`✅ 已成功清空所有历史记录`);
    } catch (err) {
        console.error(`❌ 清空历史记录时出错:`, err);
    }
}

// 菜单右键
chrome.commands.onCommand.addListener((command) => {
    if (command === "open-proxy") {
        applyProxy();
    } else if (command === "close-proxy") {
        clearProxy();
    } else {
        clearHistory();
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'options.html' });
});

// 监听存储变化：不管是名单变了，还是 host/port/scheme 变了，都立刻同步并刷新代理
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        let needReapply = false;

        if (changes.customBypassList) {
            cachedBypassList = changes.customBypassList.newValue;
            needReapply = true;
        }
        if (changes.proxyScheme) {
            cachedScheme = changes.proxyScheme.newValue;
            needReapply = true;
        }
        if (changes.proxyHost) {
            cachedHost = changes.proxyHost.newValue;
            needReapply = true;
        }
        if (changes.proxyPort) {
            cachedPort = changes.proxyPort.newValue;
            needReapply = true;
        }

        if (needReapply) {
            console.log('检测到配置更新，正在重新应用代理...');
            applyProxy();
        }
    }
});

// 扩展启动/安装/Service Worker 唤醒时，从本地存储加载全部配置
function loadConfigAndInit() {
    chrome.storage.local.get(['customBypassList', 'proxyScheme', 'proxyHost', 'proxyPort'], (result) => {
        // 加载绕行列表
        if (result.customBypassList) {
            cachedBypassList = result.customBypassList;
        } else {
            const defaultList = ["127.0.0.1", "::1", "localhost", "*.baidu.com"];
            cachedBypassList = defaultList;
            chrome.storage.local.set({ customBypassList: defaultList });
        }

        // 加载服务器配置
        cachedScheme = result.proxyScheme || 'http';
        cachedHost = result.proxyHost || '127.0.0.1';
        cachedPort = result.proxyPort || 2335;

        // 如果用户没配置过服务器，帮其初始化默认值
        if (!result.proxyScheme || !result.proxyHost || !result.proxyPort) {
            chrome.storage.local.set({
                proxyScheme: cachedScheme,
                proxyHost: cachedHost,
                proxyPort: cachedPort
            });
        }

        console.log('已成功从本地存储加载全部规则与服务器配置');
    });
}

// 确保在安装和每次 Service Worker 启动时都加载数据
chrome.runtime.onInstalled.addListener(loadConfigAndInit);
loadConfigAndInit();