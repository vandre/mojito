chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.executeScript(null, { file: "global.js" });
    chrome.tabs.executeScript(null, { file: "mojito.js" });
});