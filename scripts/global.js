VERSION = "Mojito Options"
var OPTIONS = {}; var SESSION = {};

//Utility methods
$ = document.querySelector.bind(document);

$.req = function (url,callback,auth,method='GET',body) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onload = callback;
    if(auth!=undefined){
        xhr.setRequestHeader("Authorization",
         `Intuit_APIKey intuit_apikey=${auth},intuit_apikey_version=1.0`);
		xhr.setRequestHeader("Content-Type", "application/json");
    }
    xhr.send(body);
}

let log = {
    emojiDrink: String.fromCodePoint(0x1f379),
    emojiRocket: String.fromCodePoint(0x1f680),
    info:(msg)=>{
        console.log(`${log.emojiDrink} %c[${new Date().toLocaleString('sv')}] %c${msg}`,'color:#3eb489','color:default')
    },
    warn:(msg)=>{
        console.log(`${log.emojiDrink} %c[${new Date().toLocaleString('sv')}] %c${msg}`,'color:#3eb489', 'color:orange')
    },
    success:(msg)=>{
        console.log(`${log.emojiDrink} %c[${new Date().toLocaleString('sv')}] %c${msg}`,'color:#3eb489', 'color:green')
    },
    error:(msg)=>{
        console.log(`${log.emojiDrink} %c[${new Date().toLocaleString('sv')}] %c${msg}`,'color:#3eb489', 'color:firebrick')
    }
}

//http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
//Returns a Date using US short date format (MM-DD-YY)
Date.prototype.toShortDateString = function () {
    var dt = new Date(this.valueOf());
    var stringDate = dt.getMonth() + 1 + "/" + (dt.getDate()) + "/" + dt.getFullYear();
    return stringDate;
}

//https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
function simulateActivity(eventType) {
    // Get the element to send a click event
    var body = document.querySelector('body')
  
    // Create a synthetic click MouseEvent
    let evt = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
    });
  
    // Send the event to the checkbox element
    body.dispatchEvent(evt);
}

//There is also v1/user
function disableTimeout(){
    setInterval(function () {
        simulateActivity('mousedown');
        simulateActivity('mouseup');
        simulateActivity('click');
        $.req("pfm/v1/datetime", 
            function () { console.log('Timer cleared'); }, SESSION.appApiKey);
    },60*1000*9 );
}

function parseServerconfig(){
    var appApiKey="";
    var found=false;
    document.querySelectorAll('script[nonce]').forEach(el=> { 
        if(found==true) {return;}
        if(el.innerText.indexOf("shellApiKey")!=-1) {
            var text = el.innerText;
            text  = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
            var json= JSON.parse(text);
            appApiKey = json.appExperience.appApiKey;
            found=true;
            return ;
        }  
    });

    return appApiKey;
}

async function getOptions(){
    let config = await chrome.storage.sync.get("options");
    let defaults = {  hideAccounts: [], hideModules:[], disableTimeout: true, darkMode:false };
    let options = {...defaults, ...config.options};
    if (options.disableTimeout == true ) {  disableTimeout();  }
    chrome.storage.sync.set({ "options": options });
    return options;
}

async function getSession(){
   let config = await chrome.storage.sync.get('session');
   let session = config.session ?? {};
   session.appApiKey = session.appApiKey ?? parseServerconfig();
   chrome.storage.sync.set({"session": session});
   return session;
}