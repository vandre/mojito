var TransactionModule = (function (module) {
	function parseTransactions() {
		var json = JSON.parse(this.responseText);
		
		var tran = json.Transaction;//.slice(0,15);
		console.dir(tran);
		var rows = "";
		var tpl = "<tr{5} title='{4}'><td>{0}</td><td>{1}</td><td {8}><span>{2}</span><span {7}></span></td><td{6}>{3}</td></tr>";
		var currency = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'});
		tran.forEach(function (o) {
			var pendingCSS = (o.isPending) ? " class='pending' " : "";
			var moneyCSS = (o.amount>=0) ? " class='money' " : "";
			var noteCSS = (o.notes) ? " class='note' " : "";
			var noteTitle = (o.notes) ? " title='" + o.notes + "' " : "";
			var amount = currency.format(o.amount);
			
			rows += tpl.format(o.date, o.accountRef.name, o.description, amount, o.category.name, pendingCSS, moneyCSS, noteCSS, noteTitle);
		});
		$('#module-transactions-tbody').innerHTML = rows;
	}

	module.setup = function () {
		
		if(OPTIONS.hideModules.includes('.transactionsWidget')) { return; }
		$.req(chrome.runtime.getURL('/views/transactions.html'), function () {
			var secondColumn = $('div.second-column');
			
			if (!$('#module-transactions')) {
				secondColumn.insertAdjacentHTML('afterbegin', this.responseText);
			}
			
			//Get recent transactions (30 days)
			const today = new Date();
			const endDate = new Date(today);
			endDate.setDate(today.getDate() + 30);
			
			const startDate = new Date(today);
			startDate.setDate(today.getDate() - 30);

			var requestBody = JSON.stringify({
			"limit": 50,
			"offset": 0,
			"searchFilters": [],
			"dateFilter": {
				"type": "CUSTOM",
				"endDate": endDate.toISOString().split('T')[0],
				"startDate": startDate.toISOString().split('T')[0]
			},
			"sort": "DATE_DESCENDING"
			});

			var url = "pfm/v1/transactions/search";
			
			$.req(url, parseTransactions, SESSION.appApiKey,'POST',requestBody);

			//Transaction Module setup
			var quickView = $('#transaction-quickview');
			quickView.addEventListener("click", function () {
				this.textContent = $('#transactions-content').classList.toggle('min') ? "See More" : "See Less";
			});

			$('.transactionsWidget').classList.remove('hide');

		});
	}
	return module;
}(TransactionModule || {}))