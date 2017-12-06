function startApp() {

    setGreeting();
    showCorrectHomeView();
    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_SktZOOWOZ';
    const appSecret = '2081f3e0d0db4ef88620c4cf1da8c658';

    $('#linkMenuAppHome').click(() => showView('home'));
    $('#linkMenuUserHome').click(() => showView('home'));
    $('#linkMenuArchiveSent').click(() => showView('archiv'));
    $('#linkMenuSendMessage').click(() => showView('send'));

    $('#linkMenuLogin').click(() => showView('login'));
    $('#linkMenuRegister').click(() => showView('register'));
    $('#linkMenuMyMessages').click(() => showView('messages'));
    $('#linkMenuLogout').click(logout);

    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').hide()
    });

    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());

    //buttons
    let loginSubmit = $('#formLogin').find('input[type=submit]');
    loginSubmit.click(login);
    let registerSubmit = $('#formRegister').find('input[type=submit]');
    registerSubmit.click(register);

    let sendSubmit = $('#formSendMessage').find('input[type=submit]');
    sendSubmit.click(sendMessage);

    let myMessageBtn = $('#linkUserHomeMyMessages');
    myMessageBtn.click(() => showView('messages'));

    let mySendMessagesBtn = $('#linkUserHomeSendMessage');
    mySendMessagesBtn.click(() => showView('send'));

    let myArchivBtn = $('#linkUserHomeArchiveSent');
    myArchivBtn.click(() => showView('archiv'));


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
            case 'home':
                if (localStorage.getItem('username'))
                    showView('userHome');
                else{
                    $('#viewAppHome').show();
                }

            break;
            case 'login': $('#viewLogin').show(); break;
            case 'register': $('#viewRegister').show(); break;
            case 'userHome':
                $('#viewUserHome h1').text('Welcome, ' +
                    localStorage.getItem('username') + '!');
                $('#viewUserHome').show(); break;
            case 'messages':
                loadMessages();
                $('#viewMyMessages').show(); break;
            case 'archiv':
                loadArchive();
                $('#viewArchiveSent').show(); break;
            case 'send':
                loadSendMessageForm();
                $('#viewSendMessage').show(); break;
        }
    }

    function showCorrectHomeView() {
        if (localStorage.getItem('username'))
            showView('userHome');
        else
            showView('home');
    }

    function loadMessages() {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/messages",
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayMessages,
            error: handleError
        });

        function displayMessages(data) {
            //console.log(data)
            let form = $('#myMessages');
            form.empty();

            let table = $('<table>');
            table.append($('<thead>'))
                .append($('<tr>')
                    .append($('<th>From</th>'))
                    .append($('<th>Message</th>'))
                    .append($('<th>Date Receiver</th>')));
            let tbody = $('<tbody>');
            table.append(tbody);
            form.append(table);
            let tr = '';

            for (let element of data) {
                if(element.recipient_username.indexOf('(') !== -1){
                    let index = element.recipient_username.indexOf('(');
                    let str = element.recipient_username.substring(index + 1, element.recipient_username.length - 1);

                    if(str === localStorage.getItem('username')){
                        let tr = $('<tr>');
                        tr.append($(`<td>${element.sender_name} (${element.sender_username})</td>`));
                        tr.append($(`<td>${element.text}</td>`));
                        tr.append($(`<td>${formatDate(element._kmd.ect)}</td>`));
                        tbody.append(tr);
                    }
                }
                else{
                    if(element.recipient_username === localStorage.getItem('username')){
                        let tr = $('<tr>');
                        tr.append($(`<td>${element.sender_name} (${element.sender_username})</td>`));
                        tr.append($(`<td>${element.text}</td>`));
                        tr.append($(`<td>${formatDate(element._kmd.ect)}</td>`));
                        tbody.append(tr);
                    }
                }

                function formatDate(dateISO8601) {
                    let date = new Date(dateISO8601);
                    if (Number.isNaN(date.getDate()))
                        return '';
                    return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
                        "." + date.getFullYear() + ' ' + date.getHours() + ':' +
                        padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

                    function padZeros(num) {
                        return ('0' + num).slice(-2);
                    }
                }

            };
        }
    }

    function loadSendMessageForm() {
        $.ajax({
            url: baseUrl + "user/" + appKey,
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayRecipients,
            error: handleError
        });

        function displayRecipients (data) {
            let selectForm = $('#msgRecipientUsername');
            selectForm.empty();

            for (let element of data) {
                selectForm.append(`<option value="maria">${element.name} (${element.username})</option>`)
            }


        }
    }

    function sendMessage() {
        let message = {
            sender_username: localStorage.getItem('username'),
            sender_name: localStorage.getItem('name'),
            recipient_username: $('#formSendMessage').find('#msgRecipientUsername').find('option:selected').text(),
            text: $('#msgText').val()
        };

        if(message.text === ''){
            showError('Message box cannot be empty');
            return;
        };

        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/messages",
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(message),
            success: (() => {
                showInfo('Message sent!'),
                    showView('archiv')
            }),
            error: handleError
        });
    }

    function loadArchive() {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/messages",
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayArchiv,
            error: handleError
        });

        function displayArchiv(data) {
            let form = $('#sentMessages');
            form.empty();

            let table = $('<table>');
            table.append($('<thead>'))
                .append($('<tr>')
                    .append($('<th>To</th>'))
                    .append($('<th>Message</th>'))
                    .append($('<th>Date Sent</th>'))
                    .append($('<th>Actions</th>')));

            let tbody = $('<tbody>');
            table.append(tbody);
            form.append(table);
            let tr = '';

            for (let element of data) {
                if(element.sender_username === localStorage.getItem('username')){
                    let tr = $('<tr>');
                    tr.append($(`<td>${element.recipient_username}</td>`));
                    tr.append($(`<td>${element.text}</td>`));
                    tr.append($(`<td>${formatDate(element._kmd.ect)}</td>`));
                    let buttonDelete = $('<button>Delete</button>');
                    buttonDelete.click(() => deleteRow(element._id));
                    let td = $('<td>');
                    td.append(buttonDelete);
                    tr.append(td);

                    tbody.append(tr);
                }

            };

        }
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        };
    };

    function deleteRow(id) {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + '/messages/' + id,
            method: "DELETE",
            headers:  {
                "Authorization": "Kinvey " + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: (() => {
                loadArchive(),
                    showInfo('Message deleted!')
            }),
            error: handleError
        })
    };

    function handleError(err) {
        showError(err.message)
        //showError(err.responseJSON.description)
    };

    function login() {
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();

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
            localStorage.setItem('name', data.name),
                setGreeting();
            showView('userHome');
        }
    }

    function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();
        let name = form.find('input[name="name"]').val();

        $.ajax({
            url: baseUrl + 'user/' + appKey,
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                username: username,
                password: password,
                name: name
            }),
            success: registerSuccess,
            error: handleError
        });

        function registerSuccess(data) {
            showInfo('Registration successful');
            localStorage.setItem('username', data.username);
            localStorage.setItem('id', data._id);
            localStorage.setItem('authtoken', data._kmd.authtoken);
            localStorage.setItem('name', data.name),

                setGreeting();
            showView('home');
        }

    }

    function setGreeting() {
        let username = localStorage.getItem('username');
        if(username !== null){
            $('#spanMenuLoggedInUser').text(`Welcome, ${username}!`)
            $('#linkMenuAppHome').hide();
            $('#linkMenuLogin').hide();
            $('#linkMenuRegister').hide();
            $('#linkMenuLogout').show();
            $('#linkMenuUserHome').show();
            $('#linkMenuMyMessages').show();
            $('#linkMenuArchiveSent').show();
            $('#linkMenuSendMessage').show();
            $('#spanMenuLoggedInUser').show();
        }
        else {
            $('#loggedInUser').text('');
            $('#linkMenuAppHome').show();
            $('#linkMenuLogin').show();
            $('#linkMenuRegister').show();
            $('#linkMenuLogout').hide();
            $('#linkMenuUserHome').hide();
            $('#linkMenuMyMessages').hide();
            $('#linkMenuArchiveSent').hide();
            $('#linkMenuSendMessage').hide();
            $('#spanMenuLoggedInUser').hide();
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

    function handleError(event, response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }


}