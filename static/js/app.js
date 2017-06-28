(function () {
    let   NBU_RATES = [];
    const $form = $('#search-form');
    const $loader = $('#loader');
    const $results = $('#results');
    const $footer = $('#footer');
    const $realEstateTable = $('#real-estate-table');
    const $input = $('#name-input');

    function errorHandler (err) {
        alert('Сталася помилка!')
        console.log('API_ERROR', err)
        $form.removeClass('hidden');
        $loader.addClass('hidden');
    }

    function checkLandOption(str) {
        return /земельна/ig.test(str);
    }

    axios.get(`/exchange-rates`)
        .then(response => NBU_RATES = response.data)
        .catch(errorHandler);

    $form.on('submit', (e) => {
        e.preventDefault();

        $realEstateTable.DataTable().destroy();

        if (!NBU_RATES.length) {
            return false;
        }
        
        let value = $input.val().trim();

        if (!value.length) {
            return alert('Заповніть форму!');
        }

        value = value.replace(/ /g, '+');

        $form.addClass('hidden');
        $results.addClass('hidden');
        $footer.addClass('hidden');
        $loader.removeClass('hidden');

        axios.get(`/search/${value}`)
            .then(response => {
                $loader.addClass('hidden');
                $form.removeClass('hidden');
                $footer.removeClass('hidden');
                console.log(response);

                parseData(response.data);
                $input.val('');
            })
            .catch(errorHandler);
    });

    function parseData (collection) {
        const data = collection.declaration;
        const date = new Date();
        const dateString = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        const userData = data.step_1;
        let estateDataArr = [];
        let transportDataArr = [];
        let moneyDataArr = [];
        let exchangeMoneyDataArr = [];
        let valuableDataArr = [];

        $('#declaration-link').attr('href', `https://public.nazk.gov.ua/declaration/${collection.id}`);
        $('#declaration-year').text(data.step_0.declarationYear1);
        $('#release-date').text(collection.date);
        $('#main-info').html(
            `${userData.lastname} ${userData.firstname} ${userData.middlename} <br/>
            <small>${userData.workPost}, ${userData.workPlace}</small>`
        );

        // helper function to parse owner name on every type of data
        function parseOwner (item) {
            let ownerName;
            const ownerId = Object.keys(item.rights)[0].toString();
            const owner = item.rights[ownerId];
            const relative = data.step_2[ownerId];
            
            if (ownerId === '1') {
                ownerName = 'декларант';
            } else if (relative) {
                ownerName = `${relative.subjectRelation}: ${relative.lastname} ${relative.firstname} ${relative.middlename}`;
            } else {
                ownerName = `${owner.ua_company_name} ${owner.ua_lastname} ${owner.ua_firstname} ${owner.ua_middlename}`;
            }

            return ownerName;
        }

        /*
            REAL ESTATE
         */
        let totalLandPlot = 0;
        let totalBuildings = 0;
        for (let key in data.step_3) {
            const estateItem = data.step_3[key];
            const ownerName = parseOwner(estateItem);
            const ownerId = Object.keys(estateItem.rights)[0].toString();
            const owner = estateItem.rights[ownerId];

            if (owner.ownershipType !== 'Оренда') {
                let value = (estateItem.totalArea.indexOf(',') === -1) ? +estateItem.totalArea : +estateItem.totalArea.replace(',', '.');

                if (checkLandOption(estateItem.objectType) || checkLandOption(estateItem.otherObjectType)) {
                    totalLandPlot += value;
                } else {
                    totalBuildings += value;
                }
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
            const ownerName = parseData(transportItem);
            const ownerId = Object.keys(transportItem.rights)[0].toString();
            const owner = transportItem.rights[ownerId];

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
            const ownerName = parseOwner(moneyItem);

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
            let rateObj;
            let currencyInUah = '';
            const ownerName = parseOwner(moneyItem);
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
            VALUABLE PROPERTY
         */
        let valuableCost = 0;

        for (let key in data.step_5) {
            const property = data.step_5[key];
            const ownerName = parseOwner(property);

            valuableDataArr.push(`
                <tr>
                    <td>${property.objectType} ${property.otherObjectType}</td>
                    <td>${property.manufacturerName} ${property.trademark}</td>
                    <td>${property.propertyDescr}</td>
                    <td>${property.costDateUse}</td>
                    <td>${ownerName}</td>
                </tr>
            `);
        }

        /*
            Display all data
         */
        $('#land-plot-amount').text(totalLandPlot.toFixed(2));
        $('#buildings-amount').text(totalBuildings.toFixed(2));
        $('#transport-amount').text(Object.keys(data.step_6).length);
        $('#my-transport-amount').text(ownerCounter);
        $('#money-amount').text(totalMoney);
        $('#exchange-money-amount').text(totalExchangeMoney.toFixed(0));
        $('#date').text(dateString);

        $('#summary-table').html(`
            <tr>
                <td>${totalBuildings.toFixed(2)}</td>
                <td>${totalLandPlot.toFixed(2)}</td>
                <td>${ownerCounter}</td>
                <td>${totalExchangeMoney.toFixed(0)}</td>
                <td>${totalMoney}</td>
            </tr>
        `);
        $('#real-estate').html(estateDataArr.toString());
        $('#transport').html(transportDataArr.toString());
        $('#money').html(moneyDataArr.toString());
        $('#exchange-money').html(exchangeMoneyDataArr.toString());
        $('#valuable-property').html(valuableDataArr.toString());

        $realEstateTable.DataTable({
            'paging':   false,
            'ordering': true,
            'info':     false,
            'searching':   false
        });
        
        $('.collapse').collapse({
            toggle: false
        });

        $results.removeClass('hidden');
    }
}());