// set the proxy settings for Chrome extension
const host = '127.0.0.1';
const port = 2335;
const scheme = 'http'; // 'http', 'https', 'socks4', 'socks5'

// bypass and block list
let cachedBypassList = [];
let cachedBlockList = [];

// apply the proxy settings
async function applyProxy() {
    try {
        const config = {
            mode: 'fixed_servers',
            rules: {
                singleProxy: { scheme: scheme, host, port },
                bypassList: cachedBypassList
            }
        };
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                console.error('set proxy error:', chrome.runtime.lastError.message);
            } else {
                console.info('proxy applied successfully');
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

chrome.contextMenus.removeAll(() => {
    ['open(Ctrl+Shift+Space)', 'close(Ctrl+Space)','clearHistory'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

// listener for context menu clicks
chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open(Ctrl+Shift+Space)': applyProxy(); break;
        case 'close(Ctrl+Space)': clearProxy(); break;
        case 'clearHistory': clearHistory(); break;
    }
});

// check if the hostname matches the domain
function isMatchDomain(hostname, domain) {
    // 支持 *.example.com
    if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
    }

    // 支持 *example.com（你的写法）
    if (domain.startsWith('*')) {
        const baseDomain = domain.slice(1);
        return hostname === baseDomain || hostname.endsWith(baseDomain);
    }

    // 完全匹配
    return hostname === domain;
}

// clear history
async function clearHistory() {
    for (const domain of cachedBlockList) {
        try {
            // results in broader search
            const searchText = domain.startsWith('*.') ? domain.slice(2) : domain;

            // async query history
            const results = await chrome.history.search({
                text: searchText,
                maxResults: 1000
            });

            // filter and delete match url
            const deletions = results.map(item => {
                try {
                    return isMatchDomain(new URL(item.url).hostname, domain) ? chrome.history.deleteUrl({url: item.url}) : null;
                } catch (e) {
                    //ignore can't match url
                }
            }).filter(Boolean);

            await Promise.all(deletions);
            console.log(`✅ Cleared history for domain: ${domain}`);
        } catch (err) {
            console.error(`❌ Error clearing history for domain ${domain}:`, err);
        }
    }
}
// command
chrome.commands.onCommand.addListener((command) => {
    if (command === "open-proxy") {
        applyProxy();
    } else if (command === "close-proxy") {
        clearProxy();
    } else {
        clearHistory();
    }
});
// 在 background.js 中添加
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: 'options.html'
    });
});
// 监听存储变化：当 options.js 修改了存储，这里会立刻触发
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.customBypassList) {
        console.log('检测到名单更新，正在重新应用代理...');
        // 更新内存中的变量
        cachedBypassList = changes.customBypassList.newValue;
        // 立即重新应用代理设置
        applyProxy();
    }
});

// 扩展启动/安装时，从存储加载配置（保证持久化）
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['customBypassList'], async (result) => {
        if (result.customBypassList) {
            cachedBypassList = result.customBypassList;
        } else {
            // 如果是第一次安装，将代码里的默认名单存入 storage
            cachedBypassList = await fetch('https://kv.alal.site/api?key=GProxy-Pass', {
                method: 'GET',
                headers: {'Content-Type': 'application/json', 'appKey': 'password'},
            });
            chrome.storage.local.set({customBypassList: cachedBypassList});
        }
    });
});