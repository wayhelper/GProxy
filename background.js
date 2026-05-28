let cachedScheme = 'http';
let cachedHost = '127.0.0.1';
let cachedPort = 2334;
let cachedBypassList = [];

chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local') {
        let needReapply = false;
        if (changes.customBypassList) {
            cachedBypassList = changes.customBypassList.newValue || cachedBypassList;
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
            await applyProxy();
        }
    }
});

function applyProxy() {
    return new Promise((resolve, reject) => {
        try {
            const config = {
                mode: 'fixed_servers',
                rules: {
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
                    reject(chrome.runtime.lastError);
                } else {
                    console.info(`proxy applied successfully: ${cachedScheme}://${cachedHost}:${cachedPort}, bypass: ${cachedBypassList.join(', ')}`);
                    resolve();
                }
            });
        } catch (err) {
            console.error('apply proxy error:', err);
            reject(err);
        }
    });
}

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
    ['open', 'close','clear'].forEach(id => {
        chrome.contextMenus.create({ id, title: id, contexts: ['all'] });
    });
});

chrome.contextMenus.onClicked.addListener(info => {
    switch (info.menuItemId) {
        case 'open': applyProxy(); break;
        case 'close': clearProxy(); break;
        case 'clear': clearHistory(); break;
    }
});

async function clearHistory() {
    try {
        await chrome.history.deleteAll();
        console.log(`✅ All history records have been successfully cleared.`);
    } catch (err) {
        console.error(`❌ Error clearing history:`, err);
    }
}

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'options.html' });
});

function loadConfigAndInit() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['customBypassList', 'proxyScheme', 'proxyHost', 'proxyPort'], (result) => {
            if (result.customBypassList && Array.isArray(result.customBypassList)) {
                cachedBypassList = result.customBypassList;
            } else {
                const defaultList = ["127.0.0.1", "::1", "localhost", "*.baidu.com"];
                cachedBypassList = defaultList;
                chrome.storage.local.set({ customBypassList: defaultList });
            }

            cachedScheme = result.proxyScheme || 'http';
            cachedHost = result.proxyHost || '127.0.0.1';
            cachedPort = result.proxyPort || 2334;

            if (!result.proxyScheme || !result.proxyHost || !result.proxyPort) {
                chrome.storage.local.set({
                    proxyScheme: cachedScheme,
                    proxyHost: cachedHost,
                    proxyPort: cachedPort
                });
            }
            console.log('Successfully loaded all rules and server configuration from local storage.');
            resolve();
        });
    });
}

chrome.runtime.onInstalled.addListener(async () => {
    await loadConfigAndInit();
    await applyProxy();
    console.log('apply proxy successfully');
});