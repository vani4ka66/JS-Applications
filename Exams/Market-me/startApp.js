function startApp() {

    setGreeting();
    showCorrectHomeView();

    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_HJsApazdZ';
    const appSecret = 'e8d9b7ed69be497e98aa2906b278421d';

    $('#linkMenuAppHome').click(() => showView('home'));
    $('#linkMenuLogin').click(() => showView('login'));
    $('#linkMenuRegister').click(() => showView('register'));
    $('#linkMenuLogout').click(logout);

    $('#linkMenuUserHome').click(() => showView('userHome'));
    $('#linkMenuShop').click(() => showView('shop'));
    $('#linkMenuCart').click(() => showView('cart'));

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

   let shopBtn = $('#linkUserHomeShop');
    shopBtn.click(() => showView('shop'));

   let cartBtn = $('#linkUserHomeCart');
   cartBtn.click(() => showView('cart'));

   function handleError(err) {
       showError(err.message)
       //showError(err.responseJSON.description)
   };

    function showView(view) {
        $('section').hide();
        switch (view){
            case 'home':
                if (localStorage.getItem('username')){
                    showView('userHome');
                }
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
            case 'shop':
                loadShops();
                $('#viewShop').show(); break;
            case 'cart':
                loadCart();
                $('#viewCart').show(); break;
        }
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(() => $('#infoBox').fadeOut(), 3000);
    };

    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
    };

    function setGreeting() {
        let username = localStorage.getItem('username');
        if(username !== null){
            $('#spanMenuLoggedInUser').text(`Welcome, ${username}!`)
            $('#linkMenuAppHome').hide();
            $('#linkMenuLogin').hide();
            $('#linkMenuRegister').hide();
            $('#linkMenuLogout').show();
            $('#linkMenuUserHome').show();
            $('#linkMenuShop').show();
            $('#linkMenuCart').show();
            $('#spanMenuLoggedInUser').show();
        }
        else {
            $('#spanMenuLoggedInUser').text('');
            $('#linkMenuAppHome').show();
            $('#linkMenuLogin').show();
            $('#linkMenuRegister').show();
            $('#linkMenuLogout').hide();
            $('#linkMenuUserHome').hide();
            $('#linkMenuShop').hide();
            $('#linkMenuCart').hide();
            $('#spanMenuLoggedInUser').hide();
        }

    }

    function showCorrectHomeView() {
        if (localStorage.getItem('username'))
            showView('userHome');
        else
            showView('home');
    }

    function loadShops() {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/market",
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayShops,
            error: handleError
        });

        function displayShops(data) {
            let form = $('#shopProducts');

            let tbody = $('#shopProducts').find('tbody');
            tbody.empty();

            let tr = '';

            for (let element of data) {
                    let tr = $('<tr>');
                    tr.append($(`<td>${element.name}</td>`));
                    tr.append($(`<td>${element.description}</td>`));
                    tr.append($(`<td>${element.price.toFixed(2)}</td>`));
                    let td = $('<td>');
                    let purchaseBtn = $('<button>Purchase</button>');
                    
                    purchaseBtn.click(() => purchaseFunc(element));
                    td.append(purchaseBtn);
                    tr.append(td);
                    tbody.append(tr);
            };
            showInfo('Shop loaded successfully.');
        }
    }

    function loadCart() {
        let id = localStorage.getItem('id');
        $.ajax({
            url: baseUrl + "user/" + appKey + '/' +  id,
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: function (data) {
                let cart = data.cart || {};
                displayCart(cart);
            },
            error: handleError
        });

        let tbody = $('#cartProducts').find('tbody');

        function displayCart(data) {
            tbody.empty();
            for (let element in data) {
                let tr = $('<tr>');
                tr.append($(`<td>${data[element].product.name}</td>`));
                tr.append($(`<td>${data[element].product.description}</td>`));
                tr.append($(`<td>${data[element].quantity}</td>`));
                tr.append($('<td>').text((Number(data[element].quantity) * Number(data[element].product.price)).toFixed(2)));
                let td = $('<td>');
                let discartBtn = $('<button>Discart</button>');

                discartBtn.click(() => discartFunc(element));
                td.append(discartBtn);
                tr.append(td);
                tbody.append(tr);
            }
             //showInfo('Cart loaded successfully.');

        }
    }

    function purchaseFunc(product) {
        $.ajax({
            url: baseUrl + "user/" + appKey + '/' + localStorage.getItem('id'),
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: updateCart,
            error: handleError
        });

        function updateCart(data) {
            data.cart = data.cart || {};

            if(data.cart.hasOwnProperty(product._id)){
                data.cart[product._id].quantity = Number(data.cart[product._id].quantity) + 1;
            }
            else {
                data.cart[product._id] = {
                    quantity: 1,
                    product: {
                        name: product.name,
                        description: product.description,
                        price: product.price
                    }
                };

            }
            $.ajax({
                url: baseUrl + "user/" + appKey + '/' + localStorage.getItem('id'),
                method: "PUT",
                headers: {
                    'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                success: ()=> {
                    showInfo('Product purchased.');
                    showView('cart');
                },
                error: handleError
            });
        }


    }

    function discartFunc(productId) {
        $.ajax({
            url: baseUrl + "user/" + appKey + '/' + localStorage.getItem('id'),
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: updateCart,
            error: handleError
        });

        function updateCart(data) {
            data.cart = data.cart || {};
            let newCart = {};
            for(let id in data.cart) {
                if(id != productId) {
                    newCart[id] = data.cart[id];
                }
            }
            data.cart = newCart;

            $.ajax({
                url: baseUrl + "user/" + appKey + '/' + localStorage.getItem('id'),
                method: "PUT",
                headers: {
                    'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                success: () => {
                    showInfo('Product discarded.');
                    showView('cart');
                },
                error: handleError
            });
        }
    }

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
            url: baseUrl + 'user/' + appKey + '/',
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
            alert('LLLLL')
            showInfo('Registration successful');
            localStorage.setItem('username', data.username);
            localStorage.setItem('id', data._id);
            localStorage.setItem('authtoken', data._kmd.authtoken);
            localStorage.setItem('name', data.name),

                setGreeting();
            showView('userHome');
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

   //function handleError(event, response) {
   //    let errorMsg = JSON.stringify(response);
   //    if (response.readyState === 0)
   //        errorMsg = "Cannot connect due to network error.";
   //    if (response.responseJSON && response.responseJSON.description)
   //        errorMsg = response.responseJSON.description;
   //    showError(errorMsg);
   //}


}