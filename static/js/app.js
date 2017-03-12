(function () {
    console.info('App started!');
    
    const $form = $('#search-form');
    const $loader = $('#loader');
    const $results = $('#results');
    const $realEstateTable = $('#real-estate-table');
    const $input = $('#name-input');

    $form.on('submit', (e) => {
        e.preventDefault();
        
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
            .catch(err => {
                alert('Сталася помилка! Натисніть F12 для деталей.')
                console.log('API_ERROR', err)
                $form.removeClass('hidden');
                $loader.addClass('hidden');
            });
    });

    function parseData (data) {
        const userData = data.step_1;
        const $transportTable = $('#transport');
        let estateDataArr = [];
        let transportDataArr = [];
        let moneyDataArr = [];

        $('#main-info').html(`${userData.lastname} ${userData.firstname} ${userData.middlename} <br/> <small>${userData.workPost}</small>`);

        /*
            REAL ESTATE
         */
        for (let key in data.step_3) {
            const estateItem = data.step_3[key];

            const ownerId = Object.keys(estateItem.rights)[0].toString();
            const owner = estateItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            let ownerName;
            
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

            const ownerId = Object.keys(transportItem.rights)[0].toString();
            const owner = transportItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            let ownerName;
            
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

            const ownerId = Object.keys(moneyItem.rights)[0].toString();
            const owner = moneyItem.rights[ownerId];
            const relative = data.step_2[ownerId];
            let ownerName;
            
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
            Display all data
         */
        $('#transport-amount').text(Object.keys(data.step_6).length);
        $('#my-transport-amount').text(ownerCounter);
        $('#money-amount').text(totalMoney);

        $('#real-estate').html(estateDataArr.join(''));
        $('#transport').html(transportDataArr.join(''));
        $('#money').html(moneyDataArr.join(''));

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