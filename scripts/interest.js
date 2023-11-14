var round = function (value, decimals) { return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals); }
var roundCents = function (value) { return round(value, 2); }
var isInt = function (val) { return (typeof val === 'number' && (val % 1) === 0); }
var isNum = function (val) { return (typeof val === 'number'); }
//If days parameter is not passed, then assume compound monthly
//balance: current balance
var simpleInterest = function (options) {
    var balance = options.balance;
    var rate = options.rate;
    var days = options.days;

    var factor1 = balance * rate;
    var result = 0;

    if (days == null) {
        result = factor1 / 12;
    }
    else {
        if (!isInt(days) || days < 0) {
            throw new Error('days must be an integer greater than 0')
        };
        result = factor1 * days / 365;
    }
    return roundCents(result / 100);
}

var amortize = function (options) {
    var balance = options.balance;
    var rate = options.rate;
    var payment = options.payment;
    var startDate = options.startDate == null ? moment().startOf('month') : moment(options.startDate, 'L');
    var isDaily = !!options.isDaily; //
    var months = parseInt(options.months); //Number of months to amortize.
    var table = [];
    var interest = 0;
    var principal = 0;
    var cumInterest = 0;
    var cumPrincipal = 0;

    var paymentNum = 1;
    while (balance > 0) {
        if (isDaily) {
            var prevDate = moment(startDate).subtract(1, 'month');
            var days = startDate.diff(prevDate, 'days');
        }
        interest = simpleInterest({ balance: balance, rate: rate, days: isDaily ? days : null })

        //check if balance should be multiple of m
        if (options.extraPmt) {
            var m = options.extraPmt;
            var n = balance + interest - options.payment
            payment = roundCents(n - m * Math.floor(n / m) + options.payment)
        }
        payment = payment < (balance + interest) ? payment : roundCents(balance + interest);

        principal = roundCents(payment - interest);

        balance = roundCents(balance - principal);

        cumPrincipal = roundCents(cumPrincipal + principal);
        cumInterest = roundCents(cumInterest + interest);


        table.push({
            paymentNbr: paymentNum, paymentDate: startDate.format('MMM D YYYY')
            , payment: payment, interest: interest, principal: principal
            , cumInterest: cumInterest, cumPrincipal: cumPrincipal, balance: balance
        });

        startDate.add(1, 'month'); //mutates startDate
        paymentNum++;

        if (isInt(months) && months < paymentNum) { break; }
    }

    return table;
}

var InterestModule = (function (module) {
    function parseAccounts() {
        var json = JSON.parse(this.responseText);
        var data = json.Account;

        var loans = _(data).filter(function (acct) {
            return acct.isActive && acct.type == 'LoanAccount' && acct.currentBalance != 0 && acct.isClosed == false
        }).sortBy(function (acct) { return acct.bal * -1 }).value()


        var rows = "<option value=''>Select...</option>";
        //var tpl = "<tr ><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td></tr>";
        var tpl = "<option value='{0}'>{1}</option>"
        document.loans = {};
        loans.forEach(function (obj) {
            document.loans[obj.id] = obj;
            rows += tpl.format(obj.id, obj.name);
            //rows += tpl.format(o.id,o.name, o.bal, o.dueAmt, o.rate, o.term, o.origAmount, o.origDate);
        });

        console.dir(document.loans);

        $('#loan-select').innerHTML = rows;

    }

    function parseNumber(value, precision) {
        if (precision == null) { precision = 2 };
        var str = value.toString();
        return round(str.replace(/[^\d\.]/g, ''), precision);
    }
    function id() {
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return uuid;
    }

    function loadBookmarks() {
        BOOKMARKS.forEach(function (bookmark) {
            renderBookmark(bookmark.id, bookmark.title);
        })
    }

    function parseLoanParameters() {
        var bal = parseNumber($('#loan-balance').value);
        var rt = parseNumber($('#loan-rate').value, 3);
        var pmt = parseNumber($('#loan-pay').value);
        var day = $('#loan-due').value;
        var lmt = parseNumber($('#loan-limit').value);
        var isLmt = $('#limitMonths').checked;
        var daily = $('#isDaily').checked;
        var isExtra = $('#extraPay').checked;
        var mult = parseNumber($('#pay-mult').value, 0);
        return {
            balance: bal
            , rate: rt
            , payment: pmt
            , isDaily: daily
            , startDate: day
            , months: isLmt ? lmt : null
            , isLimit: isLmt
            , extraPmt: isExtra ? mult : null
        }
    }

    function renderBookmark(id, title) {
        var li = document.createElement('li');
        li.dataset.id = id;
        li.innerHTML = title + ' <span>✖</span>';
        $('#bookmark-wrap ul').appendChild(li);
    }

    function addBookmark() {
        //Retrieve values from form. 
        var loan = parseLoanParameters();
        //Mutate retrieved loan object and:
        // add an unique identifier and title
        loan.id = id();
        loan.title = $('input.callout').value;
        renderBookmark(loan.id, loan.title);
        BOOKMARKS.push(loan);
        chrome.storage.sync.set({ 'bookmarks': BOOKMARKS });
    }

    function toggleBookmark() {
        document.querySelectorAll('.callout').forEach(function (el) { el.classList.toggle('hide') });
    }
    function setupInterestEvents() {
        $('div#bookmark-wrap ul').addEventListener('click', function (evt) {
            var el = evt.target;
            //Delete icon is a SPAN
            if (el.nodeName == 'SPAN') {
                //Get instance of li
                var li = el.parentNode;
                var dataId = li.dataset.id;
                //clone bookmarks without element being removed;
                BOOKMARKS = _(BOOKMARKS).filter(function (b) { return b.id != dataId }).value();
                li.parentNode.removeChild(li);
                //Remove from Storage
                chrome.storage.sync.set({ 'bookmarks': BOOKMARKS });

            }
            else if (el.nodeName == 'LI') {
                //Clear loan selection dropdown
                document.querySelector('#loan-select').value = "";
                //retrieve loan by id
                var loan = _.find(BOOKMARKS, function (b) { return b.id == el.dataset.id })
                //mark bookmark as active
                document.querySelectorAll('div#bookmark-wrap ul li').forEach(function (item) { item.classList.toggle('active', item.dataset.id == loan.id) });

                $('#loan-balance').value = isNum(loan.balance) ? parseNumber(loan.balance) : "";
                $('#loan-rate').value = isNum(loan.rate) ? parseNumber(loan.rate, 3) : "";
                $('#loan-pay').value = isNum(loan.payment) ? parseNumber(loan.payment) : "";
                $('#loan-due').value = loan.startDate;
                $('#limitMonths').checked = loan.isLimit;
                $('#loan-limit').value = loan.months || "";
                $('#isDaily').checked = loan.isDaily;
                $('#extraPay').checked = loan.extraPmt != null;
                $('#pay-mult').value = loan.extraPmt || "";
                $('#pay-mult').disabled = loan.extraPmt == null;
                var result = amortize(loan);
                renderTable(result);
            }
        });

        $('#bookmark-link').addEventListener('click', function () {
            $('input.callout').value = "";
            toggleBookmark();
            $('input.callout').focus();
        });

        $('input.callout').addEventListener('keydown', function (evt) {
            if (evt.keyCode == 13) {
                toggleBookmark();
                addBookmark();
            }
        });

        $('#limitMonths').addEventListener('click', function () {
            $('#loan-limit').disabled = !this.checked;
            $('#loan-limit').value = this.checked ? 12 : '';
        });

        $('#extraPay').addEventListener('click', function () {
            $('#pay-mult').disabled = !this.checked;
            $('#pay-mult').value = this.checked ? 100 : '';
        });

        var downloadButton = $('#interest-download');
        downloadButton.addEventListener("click", downloadCSV);

        var quickView = $('#interest-quickview');

        quickView.addEventListener("click", function () {
            this.textContent = $('#amortize-content').classList.toggle('min') ? "See More" : "See Less";
        });

        $('#loan-select').addEventListener('change', function () {
            if (!this.value) { return; }
            var acct = document.loans[this.value];
            $('#loan-balance').value = isNum(acct.currentBalance) ? parseNumber(acct.currentBalance) : "";
            $('#loan-rate').value = isNum(acct.interestRate) ? parseNumber(acct.interestRate * 100, 3) : "7";
            $('#loan-pay').value = isNum(acct.absoluteMinPayment) ? parseNumber(acct.absoluteMinPayment) : 100;
            $('#loan-due').value = moment().startOf('month').format('L');

        });

        $('#amortize-button').addEventListener('click', function () {
            $('#loan-error').classList.add('hide');

            var loan = parseLoanParameters();

            if (isNaN(loan.balance) || isNaN(loan.rate) || isNaN(loan.payment) || loan.payment <= 0
                || !loan.startDate || (loan.isLimit && isNaN(loan.months))) {
                $('#loan-error').innerText = 'Uh. Oh. Please check your entries. Too many mojitos, perhaps?';
                $('#loan-error').classList.remove('hide');
                $('#amortize-content').classList.add('hide');
                return;
            }

            if (loan.balance / loan.payment > 600 || loan.payment < simpleInterest({ balance: loan.balance, rate: loan.rate })) {
                //TODO: Include interest in calculation
                $('#loan-error').innerText = 'It will take over 50 years to payoff this loan!';
                $('#loan-error').classList.remove('hide');
                $('#amortize-content').classList.add('hide');
                return;
            }

            var result = amortize(loan);
            renderTable(result);
        });
    }

    function toCurrency(number) {

        return '$' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function renderTable(result) {
        var rows = "";
        var tpl = "<tr ><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td>{6}</td><td>{7}</td></tr>";
        var cumInterest = '$0.00';
        result.forEach(function (obj) {
            cumInterest = toCurrency(obj.cumInterest);
            rows += tpl.format(obj.paymentNbr
                , obj.paymentDate
                , toCurrency(obj.payment)
                , toCurrency(obj.interest)
                , toCurrency(obj.principal)
                , cumInterest
                , toCurrency(obj.cumPrincipal)
                , toCurrency(obj.balance)
            );
        });
        //Save for later if user wants to download CSV
        document.amortizationTable = result;

        $('#amortize-time').innerHTML = humanizeDuration(result.length);
        $('#amortize-interest').innerHTML = cumInterest;
        $('#amortize-table-tbody').innerHTML = rows;
        $('#amortize-content').classList.remove('hide');

    }

    function humanizeDuration(months) {
        var years = parseInt(months / 12);
        var remainingMonths = months % 12;
        var humanized = "";
        var comma = (years && remainingMonths) ? ", " : "";

        if (years >= 1) {
            humanized += years + " year" + (years > 1 ? "s" : "") + comma;
        }

        if (remainingMonths) {
            humanized += remainingMonths + " month" + (remainingMonths > 1 ? "s " : " ");
        }
        return humanized;
    }

    function downloadCSV() {
        var table = document.amortizationTable;
        var csv = '"Payment #","Date","Payment","Interest","Principal","Cumulative Interest","Cumulative Principal","Remaining Balance"\n';
        table.forEach(function (obj) {
            csv += '"' + obj.paymentNbr + '",'
                + '"' + obj.paymentDate + '",'
                + '"' + toCurrency(obj.payment) + '",'
                + '"' + toCurrency(obj.interest) + '",'
                + '"' + toCurrency(obj.principal) + '",'
                + '"' + toCurrency(obj.cumInterest) + '",'
                + '"' + toCurrency(obj.cumPrincipal) + '",'
                + '"' + toCurrency(obj.balance) + '"'
            csv += "\n";
        });

        saveData(csv, "amortizationTable.csv");
    }

    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            blob = new Blob([data], { type: "text/csv" }),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    module.setup = function () {
        if(OPTIONS.hideModules.includes('.interestWidget')) { return; }
        
        // if(OPTIONS.interestCalc === false){			return;		}
        $.req(chrome.runtime.getURL('/views/interest.html'), function () {

            var secondColumn = $('div.second-column');
			if (!$('#module-interest')) {
				secondColumn.insertAdjacentHTML('afterbegin', this.responseText);
			}
            //Fetch accounts
            var url = "pfm/v1/accounts?offset=0&limit=1000";
            $.req(url, parseAccounts,SESSION.appApiKey);

            var picker = new Pikaday({
                field: document.getElementById('loan-due'),
                firstDay: 1,
                minDate: new Date('1981-01-01'),
                format: 'L',
                yearRange: [1981, 2050],
                onSelect: function () {
                    $('#loan-due').value = this.toString('L');
                }
            });

            setupInterestEvents();
            chrome.storage.sync.get('bookmarks', function (obj) {
                if (obj.bookmarks == null) { obj.bookmarks = [] }
                BOOKMARKS = obj.bookmarks;
                loadBookmarks();
                $('.interestWidget').classList.remove('hide');
            });


        });
    }
    return module;
}(InterestModule || {}))