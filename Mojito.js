//http://www.javascriptobfuscator.com/default.aspx
function updateIcon(btn, sortOrder) {
    if (sortOrder == undefined) {
        event.stopPropagation();
        if (btn.classList.contains('desc')) {
            btn.classList.remove('desc');
            btn.classList.add('asc');
            return -1
        }
        else if (btn.classList.contains('asc')) {
            btn.classList.remove('asc');
            return 0;
        }
        else {
            btn.classList.add('desc');
            return 1;
        }
    }
    else {
        switch (sortOrder) {
            case -1:
                btn.classList.remove('desc');
                btn.classList.add('asc');
                break;
            case 0:
                btn.classList.remove('asc');
                btn.classList.remove('desc');
                break;
            case 1:
                btn.classList.remove('asc');
                btn.classList.add('desc');
                break;
        }
        return sortOrder;
    }
}

function getSortOrder(el) {
    var result = 0;
    if (el.classList.contains('desc')) {
        result = 1;
    }
    else if (el.classList.contains('asc')) {
        result = -1;
    }
    return result;
}

function sortBalances(sortOrder,sortList) {
    var sortType = isNaN(sortOrder) ? updateIcon(this) : sortOrder;
    //Save sort preference
    if (isNaN(sortOrder)) { OPTIONS[this.parentElement.id] = sortType; }
    chrome.storage.sync.set({ 'options': OPTIONS });
    var arr = [];
    var parentNode= sortList || this.nextElementSibling; //Get UL
    var accounts = parentNode.querySelectorAll("li.accounts-data-li");
    accounts.forEach(function (n) { arr.push(n) });
    arr.sort(function (a, b) {
        var result, keyA, keyB;
        if (sortType != 0) {
            //locate the HTML element that holds the balance for an account
            var currencyA = a.querySelector("span.balance").textContent;
            var currencyB = b.querySelector("span.balance").textContent;
            //Convert the balance to number that javascript can understand
            keyA = Number(currencyA.replace(/[^-0-9\.]+/g, ""));
            keyB = Number(currencyB.replace(/[^-0-9\.]+/g, ""));
            result = (keyA - keyB) * sortType;
        }
        else {
            acctA = a.querySelector("a.accountName").textContent;
            acctB = b.querySelector("a.accountName").textContent;
            var aliasA = a.querySelector("span.nickname").textContent;
            var aliasB = b.querySelector("span.nickname").textContent;
            keyA = acctA + aliasA;
            keyB = acctB + aliasB;
            result = (keyA < keyB) ? 1 : -1;
        }
        return result;

    });
    //Reorder nodes based on array
    var i = 0;
    while (arr.length) { parentNode.insertBefore(arr.pop(), parentNode.childNodes[i++]);}
    arr = null;
}

function bindHandlers() {
    //console.log('init called');

    //Add button and default to descending
    var html = '<a class="mojito"> </a>';
    document.querySelectorAll('div.account-header-wrapper').forEach(function (el) {
        el.insertAdjacentHTML("afterend", html);
    });
    //Attach event handlers and apply initial sort;
    document.querySelectorAll("a.mojito").forEach(function (el) {
        el.addEventListener("click", sortBalances);
        var sortOrder = (OPTIONS[el.parentElement.id] != undefined) ? OPTIONS[el.parentElement.id] : 1;
        sortBalances(sortOrder, el.nextElementSibling);
        updateIcon(el, sortOrder);
    });
    
}

function setupRefreshObserver() {
    var systemMessages = $('systemMessages');
    if (!systemMessages) { return;}
    var refreshObserver = new window.MutationObserver(function (mutations) {

        if (systemMessages.querySelector('div.refresh-message-done') != undefined) {
            //setTimeout is an unfortunate hack here because the refresh message is updated before the actual account nodes are.
            setTimeout(function () {
                hideAccounts();
                document.querySelectorAll('a.mojito + ul').forEach(function (el) {
                    sortBalances(getSortOrder(el.previousElementSibling), el);
                })
            }, 2000);
        }
    });
    refreshObserver.observe(systemMessages, { childList: true, subtree: true });

}
function hideAccounts() {
    //Hide Accounts with zero balances
    if (OPTIONS.hideZeroBalance) {
        var accounts = document.querySelectorAll("li#moduleAccounts-credit li.accounts-data-li");
        accounts.forEach(function (n) {
            if (!n.classList.contains('error')) {
                var bal = n.querySelector("span.balance").textContent;
                if (bal == "$0.00") { n.parentElement.removeChild(n) }
            }
        });
    }
}

function hideModules() {
    //var parent = $('overview-right-column');
    //parent.id = 'mojito-right';
    //Hide unwanted modules
    if (OPTIONS.layout) {
        OPTIONS.layout.forEach(function (id) {
            var el = document.getElementById(id);
            if(el) {  el.parentElement.classList.add('hide'); }
        });
    }
}

function setupModules() {
    TransactionModule.setup();
    hideModules();
}

function removeAds(){
	var adv = document.querySelectorAll('a.accounts-adv');
	adv.forEach(function(el){ el.parentNode.removeChild(el);}); 
}

(function () {
    if (window.location.href.indexOf('overview.event') == -1) {
        //console.log('Mojito exit');
        return;
    }

    // GA (anonymous)
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-49104711-2']);
    _gaq.push(['_trackPageview']);
    (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();

    var target = document.getElementById('body-mint');
    var observer = new window.MutationObserver(function (mutations) {
        if (!observer.hasModules) {
            var moduleAlert = $('module-alert');
            var moduleTransactions = $('module-transactions');
            if (moduleAlert != undefined && !moduleTransactions) {
                setupModules();
                observer.hasModules = true;
            }
        }
        if (!observer.hasAccounts) {
            var count = document.querySelectorAll("li.accounts-data-li").length;
            if (count > 5) {
                observer.hasAccounts = true;
            }
        }
        if (observer.hasAccounts && observer.hasModules) {
            observer.disconnect();
            //Remove blue ads:
			removeAds();
            bindHandlers();
            hideAccounts();
            setupRefreshObserver();
        }

    });
    observer.observe(target, { childList: true, subtree: true });
    //console.log('Mojito kicks in!');
})();