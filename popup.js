document.addEventListener('DOMContentLoaded', function() {
  const modeToggle = document.getElementById('mode-toggle');
  const startButton = document.getElementById('start-slideshow');
  const body = document.body;

  // ローカルストレージからモード設定を読み込む
  const savedMode = localStorage.getItem('notionSlideshowMode');
  if (savedMode === 'dark') {
    body.classList.add('dark');
    modeToggle.checked = true;
  }

  // モードトグルの処理
  modeToggle.addEventListener('change', function() {
    body.classList.toggle('dark');
    localStorage.setItem('notionSlideshowMode', body.classList.contains('dark') ? 'dark' : 'light');
  });

  // スライドショー開始ボタンの処理
  startButton.addEventListener('click', function() {
    const mode = body.classList.contains('dark') ? 'dark' : 'light';
    chrome.runtime.sendMessage({action: "startSlideshow", mode: mode}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log("Slideshow started successfully");
      } else {
        console.error("Failed to start slideshow:", response ? response.error : "Unknown error");
      }
    });
  });
});