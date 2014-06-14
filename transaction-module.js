var TransactionModule = (function(module){
	function parseTransactions() {
		var json = JSON.parse(this.responseText);
		var tran = json.set[0].data;//.slice(0,15);
		//console.log(tran.length);
		var rows = "";
		var tpl = "<tr{5} title='{4}'><td>{0}</td><td>{1}</td><td {8}><span>{2}</span><span {7}></span></td><td{6}>{3}</td></tr>";

		tran.forEach(function (o) {
			var pendingCSS = (o.isPending) ? " class='pending' " : "";
			var moneyCSS = (!o.isDebit) ? " class='money' " : "";
			var noteCSS = (o.note) ? " class='note' " : "";
			var noteTitle = (o.note) ? " title='"+o.note+"' " : "";

			if (o.isDebit) { o.amount = "-" + o.amount; }

			rows += tpl.format(o.date, o.account, o.merchant, o.amount, o.category, pendingCSS, moneyCSS,noteCSS,noteTitle);
		});
		$('module-transactions-tbody').innerHTML = rows;
	}
	
	module.setup = function(){
		if(OPTIONS.transactions === false){
			return;
		}
		$.get(chrome.extension.getURL('/transactions.html'), function(){
			//Work around for Mint adding extra div around modules
			var moduleAlert = $('module-alert');
			var moduleAlertParent = moduleAlert.parentElement
			var el = moduleAlertParent.classList.contains('column-main') ? moduleAlert : moduleAlertParent;
			if(!$('module-transactions')){
				el.insertAdjacentHTML('afterend', this.responseText);
			}
			//Show recent transactions
			var url = "getJsonData.xevent?queryNew=&offset=0&filterType=cash&comparableType=8&acctChanged=T&task=transactions&rnd=" + Date.now();
			$.get(url, parseTransactions);

			//Transaction Module setup
			var quickView = $('transaction-quickview');
			quickView.addEventListener("click", function () {
				this.textContent = $('transactions-content').classList.toggle('min') ? "See More" : "See Less";
			});
			var triggerMenu = $('menu-trigger-transactions');
			var transactionMenu = $('module-menu-transactions');
			triggerMenu.addEventListener("click", function () { transactionMenu.classList.remove('hide'); });
			transactionMenu.addEventListener("mouseout", function (e) {
				if (transactionMenu.contains(e.relatedTarget)) { return; }
				transactionMenu.classList.add('hide');
			});
			transactionMenu.querySelectorAll("span").forEach(function (el) {
				el.addEventListener("click", function (obj) {
					$('module-transactions').classList.toggle('collapsed');
					$('transactions-content').classList.toggle('hide');
					transactionMenu.classList.add('hide');
				});
			});
		});
	}
	return module;
}(TransactionModule || {}))