chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.executeScript(null, { file: "global.js" });
    chrome.tabs.executeScript(null, { file: "transaction-module.js" });
    chrome.tabs.executeScript(null, { file: "transaction-filters.js" });
	chrome.tabs.executeScript(null, { file: "mojito.js" });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.msgName == "setDateFilters"){
        sessionStorage.setItem("startDate",request.msgData.startDate);
        sessionStorage.setItem("endDate",request.msgData.endDate);
        sendResponse({data:request.msgData});
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    function(requestDetails) {
        var url=requestDetails.url;
        if(url.indexOf('period=ALL')!=-1){
            sessionStorage.setItem("startDate","");
            sessionStorage.setItem("endDate","");
        }
        var startDate=sessionStorage.getItem("startDate");
        var endDate=sessionStorage.getItem("endDate");
        if(startDate&& endDate){
            url+="&startDate="+startDate+"&endDate="+endDate;
        }
        //return {redirectUrl:newUrl};
        return {redirectUrl:url};
    },
    {urls: ["https://wwws.mint.com/listTransaction.xevent*","https://wwws.mint.com/app/getJsonData.xevent*"]},
    ["blocking"]);

