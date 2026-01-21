const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const bypassArea = document.getElementById('bypass-list');

// 状态枚举
const STATUS = {
    CHECKING: { text: '检测中...', color: '#555' },
    CONNECTED: (ms) => ({ text: `已连接 (${ms}ms)`, color: '#03dac6' }),
    DISCONNECTED: { text: '连接超时 (未连接)', color: '#cf6679' }
};

// 更新 UI 状态
function setUIStatus(type, ms = 0) {
    const state = typeof type === 'function' ? type(ms) : type;
    statusText.textContent = state.text;
    statusDot.style.background = state.color;
    if (ms > 0) {
        statusDot.classList.add('active');
    } else {
        statusDot.classList.remove('active');
    }
}

/**
 * 模拟 Ping 功能
 * 通过 fetch youtube 的一个小资源来计算时间差
 */
async function pingTest() {
    const url = "https://www.youtube.com/favicon.ico";
    const start = Date.now();

    // 设置 3 秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        // 使用 cache: "no-store" 确保每次都是真实网络请求
        await fetch(url, {
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal
        });

        const ms = Date.now() - start;
        setUIStatus(STATUS.CONNECTED, ms);
    } catch (err) {
        setUIStatus(STATUS.DISCONNECTED);
    } finally {
        clearTimeout(timeoutId);
    }
}

// 初始化
async function init() {
    // 1. 获取本地存储的名单 (如果有)
    chrome.storage.local.get(['customBypassList'], (result) => {
        if (result.customBypassList) {
            // 使用保存的名单更新内存中的变量
            bypassArea.value = result.customBypassList.join('\n');
        }
    });
    // 2. 开始持续检测
    pingTest();
    setInterval(pingTest, 5000); // 每 5 秒更新一次延迟
}

document.getElementById('btn-save').onclick = () => {
    const newList = bypassArea.value.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // 写入存储。一旦写入成功，background.js 的 onChanged 就会立刻被触发
    chrome.storage.local.set({ customBypassList: newList }, async () => {
        await fetch('https://kv.alal.site/api?key=GProxy-Pass', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'appKey': 'password'},
            body: JSON.stringify(newList)
        });
        alert('配置已保存，代理设置已实时生效！');
        // 顺便触发一次 Ping 检测
        if (typeof pingTest === 'function') pingTest();
    });
};

init();