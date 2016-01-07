//Utility methods
$ = document.getElementById.bind(document);
$.get = function (url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url, true);
    oReq.onload = callback;
    oReq.send();
}

NodeList.prototype['forEach'] = HTMLCollection.prototype['forEach'] = Array.prototype['forEach'];

//http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};


Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
//Returns a Date using US short date format (MM-DD-YY)
Date.prototype.toShortDateString = function(){
    var dt= new Date(this.valueOf());
    var stringDate=dt.getMonth() + 1 + "/" + (dt.getDate()) + "/" + dt.getFullYear();
    return stringDate;
}

//http://marcgrabanski.com/simulating-mouse-click-events-in-javascript/
function mouseEvent(type, sx, sy, cx, cy) {
    var evt;
    var e = {
        bubbles: true,        cancelable: (type != "mousemove"),
        view: window,         detail: 0,
        screenX: sx,          screenY: sy,
        clientX: cx,          clientY: cy,
        ctrlKey: false,       altKey: false,
        shiftKey: false,      metaKey: false,
        button: 0,            relatedTarget: undefined
    };
    if (typeof (document.createEvent) == "function") {
        evt = document.createEvent("MouseEvents");
        evt.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail, e.screenX, e.screenY, e.clientX, e.clientY,e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, document.body.parentNode);
    } 
    return evt;
}

//Global vars;
var OPTIONS = {};
chrome.storage.sync.get("options", function (obj) {
    if (obj.options == undefined) { return; }
    OPTIONS = obj.options;
    if (OPTIONS.disableTimeout == true) {
        setInterval(function () {
            $('body-mint').dispatchEvent(mouseEvent('mousedown', 1, 1, 1, 1));
            $('body-mint').dispatchEvent(mouseEvent('mouseup', 1, 1, 1, 1));
            $('body-mint').click();
            $.get("userStatus.xevent?rnd=" + Date.now(), function () {});
        }, 60 * 1000 * 9);
    }
});

//chrome.storage.sync.get({ 'options': options });
var header = $("body-mint");
var hasOptionsLink=document.querySelectorAll('a.mojito-options').length>0;
if (header && !hasOptionsLink) { header.insertAdjacentHTML('beforeend', "<a href={0} class='mojito-options' target='_blank' style='position:absolute;top:12px;left:12px'>Mojito 1.54</a>".format(chrome.extension.getURL('options.html'))); }