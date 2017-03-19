(function () {
    console.info('App started!');
    
    let   NBU_RATES = [];
    const $form = $('#search-form');
    const $loader = $('#loader');
    const $results = $('#results');
    const $realEstateTable = $('#real-estate-table');
    const $input = $('#name-input');

    function errorHandler (err) {
        alert('Сталася помилка!')
        console.log('API_ERROR', err)
        $form.removeClass('hidden');
        $loader.addClass('hidden');
    }

    axios.get(`/exchange-rates`)
        .then(response => NBU_RATES = response.data)
        .catch(errorHandler);

    $form.on('submit', (e) => {
        e.preventDefault();

        if (!NBU_RATES.length) {
            return false;
        }
        
        let value = $input.val().trim();

        if (!value.length) {
            return alert('Заповніть форму!');
        }

        value = value.replace(/ /g, '+');

        $form.addClass('hidden');
        $loader.removeClass('hidden');
        $results.addClass('hidden');

        axios.get(`/search/${value}`)
            .then(response => {
                $form.removeClass('hidden');
                $loader.addClass('hidden');
                console.log(response);

                parseData(response.data.declaration);
                $input.val('');
            })
            .catch(errorHandler);
    });

    function parseData (data) {
        const date = new Date();
        const dateString = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        const userData = data.step_1;
        const $transportTable = $('#transport');
        let estateDataArr = [];
        let transportDataArr = [];
        let moneyDataArr = [];
        let exchangeMoneyDataArr = [];

        $('#main-info').html(`${userData.lastname} ${userData.firstname} ${userData.middlename} <br/> <small>${userData.workPost}</small>`);

        /*
            REAL ESTATE
         */
        for (let key in data.step_3) {
            const estateItem = data.step_3[key];

            let ownerName;
            const ownerId = Object.keys(estateItem.rights)[0].toString();
            const owner = estateItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            
            if (ownerId === '1') {
                ownerName = 'декларант';
            } else if (relative) {
                ownerName = `${relative.subjectRelation}: ${relative.lastname} ${relative.firstname} ${relative.middlename}`;
            } else {
                ownerName = `${owner.ua_company_name} ${owner.ua_lastname} ${owner.ua_firstname} ${owner.ua_middlename}`;
            }

            estateDataArr.push(`
                <tr>
                    <td>${estateItem.objectType} ${estateItem.otherObjectType}</td>
                    <td>${estateItem.totalArea}</td>
                    <td>${owner.ownershipType}</td>
                    <td>${owner['percent-ownership']}</td>
                    <td>${ownerName}</td>
                </tr>
            `);
        }

        /*
            TRANSPORT
         */
        let ownerCounter = 0;

        for (let key in data.step_6) {
            const transportItem = data.step_6[key];

            let ownerName;
            const ownerId = Object.keys(transportItem.rights)[0].toString();
            const owner = transportItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            
            if (ownerId === '1') {
                ownerName = 'декларант';
            } else if (relative) {
                ownerName = `${relative.subjectRelation}: ${relative.lastname} ${relative.firstname} ${relative.middlename}`;
            } else {
                ownerName = `${owner.ua_company_name} ${owner.ua_lastname} ${owner.ua_firstname} ${owner.ua_middlename}`;
            }

            if (owner.ownershipType === 'Власність') {
                ownerCounter++;
            }

            transportDataArr.push(`
                <tr>
                    <td>${transportItem.objectType} ${transportItem.otherObjectType}</td>
                    <td>${transportItem.brand} ${transportItem.model}</td>
                    <td>${transportItem.graduationYear}</td>
                    <td>${owner.ownershipType}</td>
                    <td>${ownerName}</td>
                </tr>
            `);
        }

        /*
            MONEY
         */
        let totalMoney = 0;

        for (let key in data.step_11) {
            const moneyItem = data.step_11[key];

            let ownerName;
            const ownerId = Object.keys(moneyItem.rights)[0].toString();
            const owner = moneyItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            
            if (ownerId === '1') {
                ownerName = 'декларант';
            } else if (relative) {
                ownerName = `${relative.subjectRelation}: ${relative.lastname} ${relative.firstname} ${relative.middlename}`;
            } else {
                ownerName = `${owner.ua_company_name} ${owner.ua_lastname} ${owner.ua_firstname} ${owner.ua_middlename}`;
            }

            totalMoney += +moneyItem.sizeIncome;

            moneyDataArr.push(`
                <tr>
                    <td>${moneyItem.source_citizen}</td>
                    <td>${moneyItem.source_ua_company_name} ${moneyItem.source_eng_company_name} ${moneyItem.source_ua_lastname} ${moneyItem.source_ua_firstname} ${moneyItem.source_ua_middlename}</td>
                    <td>${moneyItem.objectType} ${moneyItem.otherObjectType}</td>
                    <td>${moneyItem.sizeIncome}</td>
                    <td>${ownerName}</td>
                </tr>
            `);
        }

        /*
            EXCHANGE MONEY
         */
        let totalExchangeMoney = 0;

        for (let key in data.step_12) {
            const moneyItem = data.step_12[key];

            let ownerName;
            let rateObj;
            let currencyInUah = '';
            const ownerId = Object.keys(moneyItem.rights)[0].toString();
            const owner = moneyItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            const currency = moneyItem.assetsCurrency;
            const size = +moneyItem.sizeAssets;

            if (currency !== 'UAH') {
                rateObj = NBU_RATES.find(item => item.cc === currency);
                currencyInUah = size * rateObj.rate;
                totalExchangeMoney += currencyInUah;
                currencyInUah = currencyInUah.toFixed(0);
            } else {
                totalExchangeMoney += size;
            }

            if (ownerId === '1') {
                ownerName = 'декларант';
            } else if (relative) {
                ownerName = `${relative.subjectRelation}: ${relative.lastname} ${relative.firstname} ${relative.middlename}`;
            } else {
                ownerName = `${owner.ua_company_name} ${owner.ua_lastname} ${owner.ua_firstname} ${owner.ua_middlename}`;
            }

            exchangeMoneyDataArr.push(`
                <tr>
                    <td>
                        ${moneyItem.organization_type} ${moneyItem.organization_ua_company_name}
                        ${moneyItem.organization_eng_company_name}
                        ${moneyItem.debtor_ua_lastname} ${moneyItem.debtor_ua_firstname} ${moneyItem.debtor_ua_middlename}
                        ${moneyItem.debtor_eng_lastname} ${moneyItem.debtor_eng_firstname} ${moneyItem.debtor_eng_middlename}
                    </td>
                    <td>${moneyItem.objectType} ${moneyItem.otherObjectType}</td>
                    <td>${size}</td>
                    <td>${currency}</td>
                    <td>${currencyInUah}</td>
                    <td>${ownerName}</td>
                </tr>
            `);
        }

        /*
            Display all data
         */
        $('#transport-amount').text(Object.keys(data.step_6).length);
        $('#my-transport-amount').text(ownerCounter);
        $('#money-amount').text(totalMoney);
        $('#exchange-money-amount').text(totalExchangeMoney.toFixed(0));
        $('#date').text(dateString);

        $('#real-estate').html(estateDataArr.toString());
        $('#transport').html(transportDataArr.toString());
        $('#money').html(moneyDataArr.toString());
        $('#exchange-money').html(exchangeMoneyDataArr.toString());

        if (!$realEstateTable.hasClass('dataTable')) {
            $realEstateTable.DataTable({
                'paging':   false,
                'ordering': true,
                'info':     false,
                'searching':   false
            });
        }
        
        $results.removeClass('hidden');
    }
}());