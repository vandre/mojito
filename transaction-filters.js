function AddCustomDateFilterBtn(){
    var label='Date Range: ';
    var button='<a class="btn btn-hollow btn-sm date-range between" href="javascript://"  title="Apply this date filter" data-filter="xy">Apply Filter</a>';
    var fields='<input type="text" id="start" placeholder="Start Date" /><input type="text" id="end" placeholder="End Date" />';
    var tpl = label+fields+button;
    $('controls-top').insertAdjacentHTML("beforeend", tpl);

    var picker = new Pikaday({
        field: document.getElementById('start'),
        firstDay: 1,
        minDate: new Date('2006-01-01'),
        format:'L',
        yearRange: [2006,2037],
        onSelect: function() {
            picker2.setMinDate(this.getDate());
            $('start').value=this.toString('L');
        }
    });
    var picker2 = new Pikaday({
        field: document.getElementById('end'),
        firstDay: 1,
        minDate: new Date('2006-01-01'),
        format:'L',
        yearRange: [2006,2037],
        onSelect: function() {
            picker.setMaxDate(this.getDate());
            $('end').value=this.toString('L');
        }
    });
}
function AddDateFilterBtn(el,description,filterCode){
    var title="Apply this date filter";
    var tpl='<a class="btn btn-hollow btn-sm date-range" href="javascript://"  title="{0}" data-filter="{2}">{1}</a>';
    var btn=tpl.format(title,description,filterCode);
    el.insertAdjacentHTML("beforeend", btn);
}
function bindDateFilterHandlers(){
    document.querySelectorAll("a.date-range").forEach(function (el) {
        el.addEventListener("click", filterbByDate);
    });

    bindClearDateFilter("#search-clear");
    bindClearDateFilter("#search-date a");

}

function bindClearDateFilter(btn){
    document.querySelectorAll(btn).forEach(function (el) {
        el.addEventListener("click", function(){
            document.querySelectorAll('a.date-range.selected').forEach(function(node){
                node.classList.remove('selected');
            });
            window.location.hash="";
        });
    });
}
function filterbByDate(){
    var filterCode=this.getAttribute('data-filter');
    switch (filterCode){
        case "tw":
            SetFilter(getWeekRange(false));
            break;
        case "lw":
            SetFilter(getWeekRange(true));
            break;
        case "tm":
            SetFilter(getMonthRange(false));
            break;
        case "lm":
            SetFilter(getMonthRange(true));
            break;
        case "xy":
            SetFilter(getCustomRange());
            break;

    }
    document.querySelectorAll('a.date-range.selected').forEach(function(node){
        node.classList.remove('selected');
    });
    this.classList.add('selected');
}

function getCustomRange(){
    var start=$('start').value;
    var end = $('end').value;
    return {    startDate:start, endDate:end}
}

function getWeekRange(isLastWeek){
    var today=new Date();
    var deltaFactor=(today.getDay()==0)?-6:1;
    var monday= today.addDays(-(today.getDay()-deltaFactor));
    if(isLastWeek){monday=monday.addDays(-7);}
    var sunday= monday.addDays(6);
    return {    startDate:monday.toShortDateString(),    endDate:sunday.toShortDateString()}
}

function getMonthRange(isLastMonth){
    var dt = new Date();
    dt.setDate(1);
    if(isLastMonth){
        dt.setMonth(dt.getMonth()-1);
    }
    var first=dt.toShortDateString();
    var last=getLastDayOfMonth(dt).toShortDateString();
    return {    startDate:first,    endDate:last}
}

function getLastDayOfMonth(dt){
    return new Date(dt.getFullYear(), dt.getMonth()+1, 0);
}

function parseFilterFromUrl(){
    var thisHash=window.location.hash;

    var filter=null;
    if(thisHash.indexOf("#location")!=-1){
        //There is already a filter applied, we need to parse it and preserve it
        var location = decodeURIComponent(thisHash.replace('#location:', ''));
        filter = JSON.parse(location);
        filter.filterType = filter.typeFilter || '';
    }
    return filter
}

function SetFilter(objDates){
    var data=parseFilterFromUrl();
    //If period All was part of filter, remove this property, as it prevents date range from working
    if(data && data.period){   delete data.period;       }
    else {
        //Create default filter object
        data={};
        data.query="";
        data.offset=0;
        data.typeFilter="cash";
        data.typeSort=8;
    }
    //Inject our date filter
    data.startDate=objDates.startDate;
    data.endDate=objDates.endDate;
    var newHash="#location:"+encodeURIComponent(JSON.stringify(data));
    window.location.hash=newHash;


}

//Code to add date range buttons
(function () {
    if (window.location.href.indexOf('transaction.event') == -1) {    return;    }
    var target = document.getElementById('body-mint');
    var observer = new window.MutationObserver(function (mutations) {
        var transactionControls = $('controls-top');
        var hasButtons=document.querySelectorAll('a.date-range').length>0;
        if (transactionControls != undefined && !hasButtons ) {
            AddDateFilterBtn(transactionControls,"This Week","tw");
            AddDateFilterBtn(transactionControls,"Last Week","lw");
            AddDateFilterBtn(transactionControls,"This Month","tm");
            AddDateFilterBtn(transactionControls,"Last Month","lm");
            AddCustomDateFilterBtn();
            bindDateFilterHandlers();
            observer.hasTransactions=true;
            observer.disconnect();
        }
    });
    observer.observe(target, { childList: true, subtree: true });
})();

