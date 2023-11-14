var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
var TRIAL_PERIOD_DAYS = 7;

/*****************************************************************************
* Parse the license and determine if the user should get a free trial
*  - if license.accessLevel == "FULL", they've paid for the app
*  - if license.accessLevel == "FREE_TRIAL" they haven't paid
*    - If they've used the app for less than TRIAL_PERIOD_DAYS days, free trial
*    - Otherwise, the free trial has expired 
*****************************************************************************/

function parseLicense(license) {
  var status=400;
  //Enable all features
  var enable=false;
  var licenseCreatedTime=undefined;
  if (license.result && license.accessLevel == "FULL") {
    //console.log("Fully paid & properly licensed.");
    status=200;
    enable=true;
    licenseCreatedTime= parseInt(license.createdTime,10);
  } else if (license.result && license.accessLevel == "FREE_TRIAL") {
    licenseCreatedTime=parseInt(license.createdTime, 10);
    var daysAgoLicenseIssued = Date.now() - licenseCreatedTime;
    daysAgoLicenseIssued = daysAgoLicenseIssued / 1000 / 60 / 60 / 24;
    if (licenseCreatedTime < new Date('2014/06/05').getTime()){
      //console.log("Legacy mode");
      status=201;
      enable=true;
    }
    else if (daysAgoLicenseIssued <= TRIAL_PERIOD_DAYS) {
      //console.log("Free trial, still within trial period");
      status=202;
      enable=true;
    } else {
      //console.log("Free trial, trial period expired.");
      status=402;
      enable=false;
    }
  } else {
    //console.log("No license ever issued.");
    status=401;
    enable=false;
  }
  return { status: status, created: licenseCreatedTime, enable:enable};
}

/*****************************************************************************
* Helper method for making authenticated requests
*****************************************************************************/

// Helper Util for making authenticated XHRs
function xhrWithAuth(method, url, interactive, callback) {
  var retry = true;
  getToken();

  function getToken() {
    console.log("Getting auth token...");
    console.log("Calling chrome.identity.getAuthToken", interactive);
    chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
      if (chrome.runtime.lastError) {
        callback(chrome.runtime.lastError);
        return;
      }
      console.log("chrome.identity.getAuthToken returned a token", token);
      access_token = token;
      requestStart();
    });
  }

  function requestStart() {
    console.log("Starting authenticated XHR...");
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onload = requestComplete;
    xhr.send();
  }

  function requestComplete() {
    console.log("Authenticated XHR completed.");
    if (this.status == 401 && retry) {
      retry = false;
      chrome.identity.removeCachedAuthToken({ token: access_token },
                                            getToken);
    } else {
      callback(null, this.status, this.response);
    }
  }
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "checkStatus") {
      //Call to license server to request the license
      xhrWithAuth('GET', CWS_LICENSE_API_URL + chrome.runtime.id, true, function onLicenseFetched(error, status, response) {
        console.log(error, status, response);
        console.log("Parsing license...");
        response = JSON.parse(response);
        console.dir(JSON.stringify(response, null, 2));
        if (status === 200) {
          var license= parseLicense(response);
          sendResponse(license);
        } else {
          console.log("Error reading license server.");
          sendResponse({status: 500, enable:false, created: undefined});
        }
      });

    }
    else if(request.greeting=="updateFilters"){
      sessionStorage.setItem("startDate", request.filter.startDate);
      sessionStorage.setItem("endDate", request.filter.endDate);  
      sendResponse({ status: "filter updated" }); 
    }
       return true;  // <-- Required if you want to use sendResponse asynchronously!   
  });



