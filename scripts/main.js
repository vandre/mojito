function updateIcon(btn) {
     if (btn.classList.contains('asc')) {
        btn.classList.remove('asc');
        btn.classList.add('desc');
    }
    else if (btn.classList.contains('desc')) {
        btn.classList.remove('desc');
    }
    else {
        btn.classList.add('asc');
    }
}

function getSortObject(el) {
    var result = {css:'', value: 0};
    if (el.classList.contains('desc')) {
        result = {css:'desc', value: 1};
    }
    else if (el.classList.contains('asc')) {
        result = {css:'asc', value: -1};
    }
    return result;
}

function sortBalances(btn) {
    var arr = [];
    var sortOrder = getSortObject(btn);
    var parentSel = `div[data-automation-id="${btn.id}-expandable-card"] ` +
     "div[class*=AccountsOverviewstyle__StyledExpandedCardAccountList]";
    
     var arr = [...document.querySelectorAll(parentSel + " > a")];
    
    arr.sort(function (a, b) {
        var result, keyA, keyB;
        if (sortOrder.value != 0) {
            //locate the HTML element that holds the balance for an account
            var currencyA = a.querySelector("strong span").textContent;
            var currencyB = b.querySelector("strong span").textContent;
            //Convert the balance to number that javascript can understand
            keyA = Number(currencyA.replace(/[^-0-9\.]+/g, ""));
            keyB = Number(currencyB.replace(/[^-0-9\.]+/g, ""));
            result = (keyA - keyB) * sortOrder.value;
        }
        else {
            var acctA = a.querySelector("br + text span strong").textContent;
            var acctB = b.querySelector("br + text span strong").textContent;
            var aliasA = a.querySelector("text strong a").textContent;
            var aliasB = b.querySelector("text strong a").textContent;
            keyA = acctA + aliasA;
            keyB = acctB + aliasB;
            result = (keyA < keyB) ? 1 : -1;
        }
        return result;

    });
    //Reorder nodes based on array
    var i = 0;
    var parentNode = document.querySelector(parentSel);
    while (arr.length) { parentNode.insertBefore(arr.pop(), parentNode.childNodes[i++]); }
    arr = null;
    
    SESSION[btn.id]=sortOrder;
    chrome.storage.sync.set({ 'session': SESSION });
}

function initSortUI() {
    if (document.querySelectorAll('a.mojito').length != 0){ return; }
    //Add button and default to descending
    let accountTitleEl = 'ul.accounts-overview-card li div[type="button"] div[class*="ExpandableCard-title"] strong';
    document.querySelectorAll(accountTitleEl).forEach(el=>{
        let id = el.closest('div[data-automation-id]').dataset.automationId;
        let listType = id.substring(0, id.indexOf("-"))
        let sortClass = SESSION[listType]?.css ?? '';
        el.insertAdjacentHTML("afterbegin",`<a class="mojito ${sortClass}" id="${listType}"> </a>`);
    })
    
    //Attach event handlers and apply initial sort;
    document.querySelectorAll('a.mojito').forEach(el => {
        el.addEventListener('click',  (evt) => { 
            evt.stopPropagation();  
            evt.preventDefault();
            updateIcon(el); 
            sortBalances(el);
        });

        sortBalances(el);
    });

    log.info("Added Sort Buttons")

}

function hideAccounts() {
    log.info("Account list is ready");
    let accounts = [];
    for(const sel of OPTIONS.hideAccounts) {
        accounts = accounts.concat(...document.querySelectorAll(sel));
    }
  
    accounts.forEach(function (node) {
        var bal = node.querySelector('strong span').textContent;
        if (bal == "$0.00") { node.parentElement.removeChild(node) }
    });
}

function setDarkMode() {
    if (OPTIONS.darkMode) {
        var styleEl = document.createElement('style'), styleSheet;
        // Append style element to head
        document.body.appendChild(styleEl);
        // Grab style sheet
        styleSheet = styleEl.sheet;
        
        var rule1 = '.pfm-overview-ui { background-color: rgb(57, 58, 61) }';
        var rule2 = '.pfm-overview-ui td, .pfm-overview-ui span, div.CardView .cardHeader h3 {color:white}';
        var rule3 = '.pfm-overview-ui div[class*=ExpandableCard] { background-color:transparent}';
        var rule4 = 'div.module-transactions table tbody tr:hover * { color:black }';
        var rule5 = 'div.CardView a:link, div.CardView a:visited { color:white }';
        var rule6 = '.pfm-overview-ui.pfm-overview-ui [class*=OverviewCard-title] {color:white}';
        var rule7 = 'th[class*=InvestmentsTable] {background-color:transparent !important}';
       
        styleSheet.insertRule(rule1, styleSheet.cssRules.length);
        styleSheet.insertRule(rule2, styleSheet.cssRules.length);
        styleSheet.insertRule(rule3, styleSheet.cssRules.length);
        styleSheet.insertRule(rule4, styleSheet.cssRules.length);
        styleSheet.insertRule(rule5, styleSheet.cssRules.length);
        styleSheet.insertRule(rule6, styleSheet.cssRules.length);
        styleSheet.insertRule(rule7, styleSheet.cssRules.length);
    }
   


}

function waitForEl(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function getClassWithSuffix(tagName,className){
    var fullClassName=className;
    //todo fix selector it's not always nav
    var sel = `nav ${tagName}[class*=${className}]`;
    document.querySelector(sel).classList.forEach(
        item=>{ if (item.indexOf(className)!=-1) {fullClassName= item; } });
    return fullClassName;
}

function setHeader() {
    log.info('Nav is ready');
    if(document.getElementById("mojito")){return;}
    var mojitoLink=`
    <li id="mojito" class="${ getClassWithSuffix('li','LeftNavigation-item') }">
        <a aria-current="page"  class="${getClassWithSuffix('a','LeftNavigation-link') }" 
        href="${chrome.runtime.getURL('views/options.html')}" target="_blank" title="${VERSION}">
        <span class="${ getClassWithSuffix('span','LeftNavigation-linkContent') }" tabindex="-1">
            <span class="${ getClassWithSuffix('span', 'LeftNavigation-label') }">Mojito Options</span>
        </span>
        </a>
    </li> `;

    var nav = document.querySelector('nav ul');
    nav.insertAdjacentHTML('beforeend', mojitoLink);
}


function hideSelected(el) {
    el.classList.add('hide');
    log.info(`Hid ${this}`);
}

function bootstrap(){
    
    log.info("Bootstrapping..." + log.emojiRocket + log.emojiRocket);
    
    waitForEl('div.second-column').then(InterestModule.setup);
    waitForEl('div.second-column').then(TransactionModule.setup);
    waitForEl('div.pfm-overview-ui div.pfm-overview-ui span').then(hideAccounts);
    waitForEl('div.pfm-overview-ui div.pfm-overview-ui span').then(initSortUI);

    for(const sel of OPTIONS.hideModules) {
        waitForEl(sel).then(hideSelected.bind(sel));
    }
}

waitForEl('nav').then(setHeader);

(async function() {
    [OPTIONS, SESSION] = await Promise.all([getOptions(), getSession()]);
    waitForEl('div.second-column').then(bootstrap);
    
    setDarkMode();
    
    document.querySelector('body').addEventListener('click', async (evt)=>
    {
        if(evt.target.dataset.autoSel == "nav-overview")
        {
            [OPTIONS, SESSION] = await Promise.all([getOptions(), getSession()]);
            waitForEl('div.second-column').then(bootstrap);
        }
    });

})();
