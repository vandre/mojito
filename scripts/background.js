
// chrome.webRequest.onBeforeRequest.addListener(
//     function(requestDetails) {
//         var url=requestDetails.url;

//         //The Trends page also leverages listTransaction and getJsonData
//         // We do not want to modify those request
//         if(url.indexOf('chartType')!=-1){return;}

//         if(url.indexOf('period=ALL')!=-1){
//             sessionStorage.setItem("startDate","");
//             sessionStorage.setItem("endDate","");
//         }
//         var startDate=sessionStorage.getItem("startDate");
//         var endDate=sessionStorage.getItem("endDate");
//         var re=/(startDate=)[0-9\/]*(&endDate=)[0-9\/]*/g;
//         //If the query string of the AJAX call already has a date do not inject date
//         if(startDate&& endDate &&!re.test(url)){
//             url+="&startDate="+startDate+"&endDate="+endDate;
//         }
//         return {redirectUrl:url};

//     },
//     {urls: ["https://mint.intuit.com/listTransaction.xevent*","https://mint.intuit.com/app/getJsonData.xevent*"]},
//     ["blocking"]);


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.greeting == "updateFilters") {
            sessionStorage.setItem("startDate", request.filter.startDate);
            sessionStorage.setItem("endDate", request.filter.endDate);
            sendResponse({ status: "filter updated" });
        }
        return true;  // <-- Required if you want to use sendResponse asynchronously!   
    }
);
