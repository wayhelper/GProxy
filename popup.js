document.getElementById('save').addEventListener('click', () => {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;

  chrome.runtime.sendMessage({ action: "updateProxy", host, port }, (response) => {
    if (chrome.runtime.lastError) {
      setModelMsg(chrome.runtime.lastError.message)
    } else {
      if (response.success) {
        setModelMsg("GProxy Connect Success !")
      } else {
        setModelMsg("Failed to connect gproxy settings.")
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
