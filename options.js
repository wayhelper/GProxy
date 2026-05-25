const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const bypassArea = document.getElementById('bypass-list');
const proxyScheme = document.getElementById('proxy-scheme');
const proxyHost = document.getElementById('proxy-host');
const proxyPort = document.getElementById('proxy-port');

const STATUS = {
    CHECKING: { text: '检测中...', color: '#555' },
    CONNECTED: (ms) => ({ text: `已连接 (${ms}ms)`, color: '#03dac6' }),
    DISCONNECTED: { text: '连接超时 (未连接)', color: '#cf6679' }
};

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

async function pingTest() {
    const url = "https://www.youtube.com/favicon.ico";
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
        await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
        const ms = Date.now() - start;
        setUIStatus(STATUS.CONNECTED, ms);
    } catch (err) {
        setUIStatus(STATUS.DISCONNECTED);
    } finally {
        clearTimeout(timeoutId);
    }
}

async function init() {
    chrome.storage.local.get(['customBypassList', 'proxyScheme', 'proxyHost', 'proxyPort'], (result) => {
        if (result.customBypassList) {
            bypassArea.value = result.customBypassList.join('\n');
        }
        proxyScheme.value = result.proxyScheme || 'http';
        proxyHost.value = result.proxyHost || '127.0.0.1';
        proxyPort.value = result.proxyPort || 2335;
    });
    pingTest();
    setInterval(pingTest, 5000);
}

document.getElementById('btn-save').onclick = () => {
    const newList = bypassArea.value.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const scheme = proxyScheme.value;
    const host = proxyHost.value.trim();
    const port = parseInt(proxyPort.value, 10);

    if (!host || isNaN(port)) {
        alert('请填写正确的主机地址和端口号！');
        return;
    }
    chrome.storage.local.set({
        customBypassList: newList,
        proxyScheme: scheme,
        proxyHost: host,
        proxyPort: port
    }, () => {
        if (typeof pingTest === 'function') pingTest();
    });
};

init();