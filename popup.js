var isconnected = false;
document.getElementById('save').addEventListener('click', () => {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;

  chrome.runtime.sendMessage({ action: "updateProxy", host, port }, (response) => {
    if (chrome.runtime.lastError) {
      setModelMsg(chrome.runtime.lastError.message)
    } else {
      if (response.success) {
        setModelMsg("GProxy Connect Success !")
        const resetButton = document.getElementById('reset');
        resetButton.hidden = false; // 显示按钮
        const saveButton = document.getElementById('save');
        saveButton.hidden = true; // 隐藏按钮
        isconnected = true;
        chrome.storage.local.set({ isconnected: true });
      } else {
        setModelMsg("Failed to connect gproxy settings.")
      }
    }
  });
});

document.getElementById('reset').addEventListener('click', () => {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;

  chrome.runtime.sendMessage({ action: "disconnectProxy", host, port }, (response) => {
    if (chrome.runtime.lastError) {
      setModelMsg(chrome.runtime.lastError.message)
    } else {
      if (response.success) {
        setModelMsg("GProxy Disconnect Success !")
        const resetButton = document.getElementById('reset');
        resetButton.hidden = true; // 显示按钮
        const saveButton = document.getElementById('save');
        saveButton.hidden = false; // 隐藏按钮
        isconnected = false;
        chrome.storage.local.set({ isconnected: false });
      } else {
        setModelMsg("Failed to disconnect gproxy.")
      }
    }
  });
});

function setModelMsg(msg){
  // 设置模态框内容
  document.getElementById('modal-text').textContent = msg;

  // 显示模态框
  var modal = document.getElementById('modal');
  modal.classList.add('show');

  // 模态框2秒后逐渐消失
  setTimeout(function() {
    modal.style.transition = 'opacity 1s ease-out';
    modal.style.opacity = '0';
    setTimeout(function() {
      modal.classList.remove('show');
      modal.style.opacity = '';
    }, 1000);
  }, 1500);
}
function onStartup() {
  // 读取布尔值
  chrome.storage.local.get('isconnected', (result) => {
    if (result.isconnected === true) {
      const resetButton = document.getElementById('reset');
      resetButton.hidden = false; // 显示按钮
      const saveButton = document.getElementById('save');
      saveButton.hidden = true; // 隐藏按钮
    } else {
      const resetButton = document.getElementById('reset');
      resetButton.hidden = true; // 隐藏按钮
      const saveButton = document.getElementById('save');
      saveButton.hidden = false; // 显示按钮
    }
  });
}
onStartup()