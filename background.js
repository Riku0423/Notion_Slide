chrome.runtime.onInstalled.addListener(() => {
  console.log('Notion Slideshow extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSlideshow") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startSlideshow", mode: request.mode})
          .then(response => {
            console.log("Slideshow started:", response);
            sendResponse({success: true});
          })
          .catch(error => {
            console.error("Error starting slideshow:", error);
            sendResponse({success: false, error: error.message});
          });
      } else {
        sendResponse({success: false, error: "No active tab found"});
      }
    });
    return true;  // 非同期レスポンスを示す
  }
});