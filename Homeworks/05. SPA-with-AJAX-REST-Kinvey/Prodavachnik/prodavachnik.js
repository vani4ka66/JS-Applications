function startApp() {

    setGreeting();
    $('#viewHome').show()
    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_Hy2tfArw-';
    const appSecret = '87af4f6be3d54465ad901394061f1c1c';

    $('#linkHome').click(() => showView('home'));
    $('#linkLogin').click(() => showView('login'));
    $('#linkRegister').click(() => showView('register'));
    $('#linkListAds').click(() => showView('ads'));
    $('#linkCreateAd').click(() => showView('create'));
    $('#linkLogout').click(logout);

    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').hide()
    });

    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());


    $('#buttonLoginUser').click(login);
    $('#buttonRegisterUser').click(register);
    $('#buttonCreateAd').click(createAd);


    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(() => $('#infoBox').fadeOut(), 3000);
    };

    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
    };

    function showView(view) {
        $('section').hide();
        switch (view){
            case 'home': $('#viewHome').show(); break;
            case 'login': $('#viewLogin').show(); break;
            case 'register': $('#viewRegister').show(); break;
            case 'ads':
                loadAds();
                $('#viewAds').show(); break;
            case 'create': $('#viewCreateAd').show(); break;
            case 'edit': $('#viewEditAd').show(); break;
            case 'readMore': $('#readMore').show(); break;

        }
    }

    function handleError(err) {
        showError(err.responseJSON.description)
    };

    function login() {
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        $.ajax({
            url: baseUrl + 'user/' + appKey + '/login',
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: loginSuccess,
            error: handleError
        });

        function loginSuccess(data) {
            showInfo('Login successful');
            localStorage.setItem('username', data.username);
            localStorage.setItem('id', data._id);
            localStorage.setItem('authtoken', data._kmd.authtoken);
            setGreeting();
            showView('home');
        }
    }

    function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        $.ajax({
            url: baseUrl + 'user/' + appKey,
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: registerSuccess,
            error: handleError
        });

        function registerSuccess(data) {
            showInfo('Registration successful');
            localStorage.setItem('username', data.username);
            localStorage.setItem('id', data._id);
            localStorage.setItem('authtoken', data._kmd.authtoken);
            setGreeting();
            showView('home');
        }

    }

    function setGreeting() {
        let username = localStorage.getItem('username');
        if(username !== null){
            $('#loggedInUser').text(`Welcome, ${username}!`)
            $('#linkHome').show();
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkCreateAd').show();
            $('#linkListAds').show();
            $('#linkLogout').show();
            $('#loggedInUser').show();
        }
        else {
            $('#loggedInUser').text('');
            $('#linkHome').show();
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkLogout').hide();
            $('#linkCreateAd').hide();
            $('#linkListAds').hide();
            $('#loggedInUser').show();
        }

    }

    function logout() {
        $.ajax({
            url: baseUrl + 'user/' + appKey + '/_logout',
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
            },
            success: logoutSuccess(),
            error: handleError
        });

        function logoutSuccess(data) {
            localStorage.clear();
            setGreeting();
            showView('home');
        }

    }

    function loadAds() {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/reklami",
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayAds,
            error: handleError
        });

        function displayAds(data) {
            let form = $('#viewAds').find('#ads').find('table').find('tbody').find('tr');
            form.empty();

            for (let element of data) {
                let tr = $('<tr>');
                tr.append(`<td>${element.title}</td>`);
                tr.append(`<td>${element.publisher}</td>`);
                tr.append(`<td>${element.description}</td>`);
                tr.append(`<td>${element.price}</td>`);
                tr.append(`<td>${element.imageUrl}</td>`);
                tr.append(`<td>${element['DatePublished']}</td>`);
                let td = $('<td>');
                let readMore = $('<a href="#">[Read More]</a>').click(() => readMoreAd(element));
                let empty = ' ';
                td.append(readMore).append(empty);

                if(element.publisher === localStorage.getItem('username')){
                    let del = $('<a href="#">[Delete]</a>').click(() => deleteAd(element._id));
                    let empty = ' ';
                    let edit = $('<a href="#">[Edit]</a>').click(() => openUpdateAd(element));
                    td.append(del).append(empty).append(edit);

                }

                tr.append(td);
                tr.appendTo($('#viewAds').find('table').find('tbody'));

            };
        }
    }

    function createAd() {
        let titleInput = $('#formCreateAd').find("[name='title']").val();
        let descriptionInput =$('#formCreateAd').find("[name='description']").val();
        let dateInput = $('#formCreateAd').find("[name='datePublished']").val();
        let priceInput = $('#formCreateAd').find("[name='price']").val();
        let imageInput = $('#formCreateAd').find("[name='image']").val();

        if(titleInput.length === 0 ){
            showError('Title cannot be empty');
            return;
        };

        if(descriptionInput.length === 0){
            showError('Description cannot be empty');
            return;
        };

        if(imageInput.length === 0){
            showError('Image Url cannot be empty');
            return;
        };

        if(priceInput === ''){
            showError('Price cannot be empty');
            return;
        };

        if(dateInput === '' ){
            showError('Date cannot be empty');
            return;
        };

        let ad = {
            title: titleInput,
            description: descriptionInput,
            publisher: localStorage.getItem('username'),
            DatePublished: dateInput.toString('yyyy-dd-MM'),
            imageUrl: imageInput,
            price: priceInput
        };

        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/reklami",
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(ad),
            success: (() => {
                showInfo('Ad created'),
                showView('ads')
            }),
            error: handleError
        });
    }

    function deleteAd(id) {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + '/reklami/' + id,
            method: "DELETE",
            headers:  {
                "Authorization": "Kinvey " + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: (() => {
                    loadAds(),
                    showInfo('Ad deleted')
            }),
            error: handleError
        })
    };

    function openUpdateAd(element) {
        let form = $("#formEditAd");
        form.find('input[name="title"]').val(element.title);
        form.find('textarea[name="description"]').val(element.description);
        form.find('input[name="price"]').val(element.price);
        form.find('input[name="image"]').val(element.imageUrl);


        let date = element.DatePublished;
        let publisher = element.publisher;
        let id = element._id;

        $('#buttonEditAd').click(() => updateAd(date, publisher, id));

        showView('edit');
    }

    function updateAd(date, publisher, id) {
        let form = $("#formEditAd");
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = form.find('input[name="price"]').val();
        let image = form.find('input[name="image"]').val();


        if(title.length === 0 ){
            showError('Title cannot be empty');
            return;
        };

        if(description.length === 0){
            showError('Description cannot be empty');
            return;
        };

        if(image.length === 0){
            showError('Image Url cannot be empty');
            return;
        };

        if(price === ''){
            showError('Price cannot be empty');
            return;
        };

        $.ajax({
            method: "PUT",
            url: baseUrl + "appdata/" + appKey + "/reklami/" + id,
            headers:  {
                "Authorization": "Kinvey " + localStorage.getItem('authtoken')
            },
            contentType: "application/json",
            data: JSON.stringify({
                title,
                description,
                publisher,
                imageUrl: image,
                DatePublished: date,
                price
            }),
            success: (() => {
                    showInfo('Ad updated!'),
                        showView('ads')
            }),
            error: handleError
        })
    }

    function readMoreAd(element) {
        let div = $('#readMoreDiv');
        div.empty();

        div.append(`<img id="img" src="${element.imageUrl}">`);
        div.append('<br>');
        div.append('<label><strong>Title:</strong></label>');
        div.append(`<p>${element.title}</p>`);
        div.append('<label><strong>Description:</strong></label>');
        div.append(`<p>${element.description}</p>`);
        div.append('<label><strong>Publisher:</strong></label>');
        div.append(`<p>${element.publisher}</p>`);
        div.append('<label><strong>Date:</strong></label>');
        div.append(`<p>${element.DatePublished}</p>`);


        showView('readMore');
    }

  

}