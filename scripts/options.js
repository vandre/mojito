
// Saves options to sync storage.
function save_options() {
    let options = {};
    options.hideAccounts = Array.from(
        document.querySelectorAll('input[id$=Zero]:checked'), input => input.value  );
    
    options.hideModules = Array.from(
        document.querySelectorAll("input[data-type='module']:checked"), input => input.value  );
            
    options.disableTimeout = document.getElementById('cbTimeout').checked;
    
    options.darkMode = document.getElementById('cbDarkMode').checked;

    chrome.storage.sync.set({ 'options': options });
    
    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function () { status.innerHTML = ""; }, 750);
}

function putOnShades() { 
    if (this.checked) {
        document.querySelector("#doggo").src="/images/shiba_dark.png";
      } else {
        document.querySelector("#doggo").src="/images/shiba.png";
      }
}
// Restores select box state to saved value from storage.
async function restore_options() {
    let config = await chrome.storage.sync.get('options');//
    let defaults = {  hideAccounts: [], hideModules:[], disableTimeout: true, darkMode:false };
    let options = {...defaults, ...config.options};
    
    document.querySelectorAll('input[id$=Zero]').forEach(input=> {
        if (options.hideAccounts.includes(input.value)) {
            input.checked=true;
        }
    });

    document.querySelectorAll('input[data-type=module]').forEach(input=> {
        if (options.hideModules.includes(input.value)) {
            input.checked=true;
        }
    });

    document.querySelector('#cbTimeout').checked = options.disableTimeout;
    document.querySelector('#cbDarkMode').checked = options.darkMode;

    if(options.darkMode){
        document.querySelector("#doggo").src="/images/shiba_dark.png";
    }
    
}

    document.addEventListener('DOMContentLoaded', restore_options);
    document.querySelector('#save').addEventListener('click', save_options);
    document.querySelector('#cbDarkMode').addEventListener('change',putOnShades);
    document.querySelector('.tipjar').addEventListener('change',(evt=>{ 
    document.querySelector('#qrcode').src =  evt.target.value;
}));

