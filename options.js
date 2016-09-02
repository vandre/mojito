NodeList.prototype['forEach'] = HTMLCollection.prototype['forEach'] = Array.prototype['forEach'];
var OPTIONS = {};
// Saves options to localStorage.
function save_options() {
    OPTIONS.hideZeroCCBalance = document.getElementById('cbZero').checked;
    OPTIONS.hideZeroBankBalance = document.getElementById('bankZero').checked;
    OPTIONS.hideZeroInvestBalance = document.getElementById('investZero').checked;
    OPTIONS.hideZeroLoanBalance = document.getElementById('loanZero').checked;
    OPTIONS.disableTimeout = document.getElementById('cbTimeout').checked;
    OPTIONS.transactions = document.getElementById('transactions').checked;
    OPTIONS.colorBalances = document.getElementById('cbColorBalance').checked;
    OPTIONS.oldFonts = document.getElementById('cbOldFonts').checked;

    var el = document.getElementById('options');
    OPTIONS.layout=[];
    document.querySelectorAll("input[data-type='module']").forEach(function (x) {
        if (!!x.value && x.checked==false) {
            OPTIONS.layout.push(x.value);
        }
    });
    chrome.storage.sync.set({ 'options': OPTIONS });
    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function () { status.innerHTML = "";   }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    chrome.storage.sync.get('options', function (obj) {
        if (obj.options == undefined) { obj.options = {
            layout: [], transactions: true, hideZeroCCBalance: false,
            hideZeroBankBalance: false, hideZeroInvestBalance: false,
            hideZeroLoanBalance: false,
            disableTimeout: false, colorBalances:false, oldFonts:false }; }
        OPTIONS = obj.options;
        document.getElementById('cbZero').checked = obj.options.hideZeroCCBalance;
        document.getElementById('bankZero').checked = obj.options.hideZeroBankBalance;
        document.getElementById('investZero').checked = obj.options.hideZeroInvestBalance;
        document.getElementById('loanZero').checked = obj.options.hideZeroLoanBalance;
        document.getElementById('cbTimeout').checked = obj.options.disableTimeout;
        document.getElementById('cbColorBalance').checked = obj.options.colorBalances;
        document.getElementById('cbOldFonts').checked = obj.options.oldFonts;
        obj.options.layout.forEach(function (id) {
            var el= document.getElementById(id);
            if(el) el.checked = false;
        });
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
