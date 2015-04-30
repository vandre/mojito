chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.executeScript(null, { file: "global.js" });
    chrome.tabs.executeScript(null, { file: "transaction-module.js" });
    chrome.tabs.executeScript(null, { file: "transaction-filters.js" });
	chrome.tabs.executeScript(null, { file: "mojito.js" });
});

chrome.webNavigation.onReferenceFragmentUpdated.addListener(function (details) {
    var thisHash=details.url.match(/#location:.*/);
    if(thisHash){
        var location = decodeURIComponent(thisHash[0].replace('#location:', ''));
        var filter = JSON.parse(location);
        sessionStorage.setItem("startDate",filter.startDate);
        sessionStorage.setItem("endDate",filter.endDate);
    }
},{pathContains:'transaction.event'});

chrome.webRequest.onBeforeRequest.addListener(
    function(requestDetails) {
        var url=requestDetails.url;

        //The Trends page also leverages listTransaction and getJsonData
        // We do not want to modify those request
        if(url.indexOf('chartType')!=-1){return;}

        if(url.indexOf('period=ALL')!=-1){
            sessionStorage.setItem("startDate","");
            sessionStorage.setItem("endDate","");
        }
        var startDate=sessionStorage.getItem("startDate");
        var endDate=sessionStorage.getItem("endDate");
        var re=/(startDate=)[0-9\/]*(&endDate=)[0-9\/]*/g;
        //If the query string of the AJAX call already has a date do not inject date
        if(startDate&& endDate &&!re.test(url)){
            url+="&startDate="+startDate+"&endDate="+endDate;
        }
        return {redirectUrl:url};

    },
    {urls: ["https://wwws.mint.com/listTransaction.xevent*","https://wwws.mint.com/app/getJsonData.xevent*"]},
    ["blocking"]);