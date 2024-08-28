var isconnected = false;
document.getElementById('save').addEventListener('click', () => {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;

  chrome.runtime.sendMessage({ action: "updateProxy", host, port }, (response) => {
    if (chrome.runtime.lastError) {
      setModelMsg(chrome.runtime.lastError.message)
      //onStartup()
    } else {
      if (response.success) {
        setModelMsg("GProxy Connect Success !")
        const resetButton = document.getElementById('reset');
        resetButton.hidden = false; // 显示按钮
        const saveButton = document.getElementById('save');
        saveButton.hidden = true;
        isconnected = true;
        chrome.storage.local.set({ isconnected: true });
      } else {
        setModelMsg("Failed to connect gproxy settings.")
        //onStartup()
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
      //onStartup()
    } else {
      if (response.success) {
        setModelMsg("GProxy Disconnect Success !")
        const resetButton = document.getElementById('reset');
        resetButton.hidden = true;
        const saveButton = document.getElementById('save');
        saveButton.hidden = false;
        isconnected = false;
        chrome.storage.local.set({ isconnected: false });
      } else {
        setModelMsg("Failed to disconnect gproxy.")
        //onStartup()
      }
    }
  });
});

function setModelMsg(msg){
  document.getElementById('modal-text').textContent = msg;
  var modal = document.getElementById('modal');
  modal.classList.add('show');
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
  chrome.storage.local.get('isconnected', (result) => {
    if (result.isconnected === true) {
      const resetButton = document.getElementById('reset');
      resetButton.hidden = false;
      const saveButton = document.getElementById('save');
      saveButton.hidden = true;
    } else {
      const resetButton = document.getElementById('reset');
      resetButton.hidden = true;
      const saveButton = document.getElementById('save');
      saveButton.hidden = false;
    }
  });
}
onStartup()