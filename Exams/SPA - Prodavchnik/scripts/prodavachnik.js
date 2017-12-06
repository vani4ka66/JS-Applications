function startApp() {
    $('#menu').find('a').css('display', 'inline');
    const adsDiv = $('#ads');
    const adDiv = $('#ad');

   // function showView(e){
   //     $('section').hide();
   //     let target = $(e.target).attr('data-target')
   //     $('#'+ target).show();
   // }

   function showView(view){
       $('section').hide();
       switch(view){
           case 'ads': $('#viewAds').show(); loadAds();break;
           case 'home': $('#viewHome').show(); break;
           case 'login': $('#viewLogin').show(); break;
           case 'register': $('#viewRegister').show(); break;
           case 'create': $('#viewCreateAd').show(); break;
           case 'edit': $('#viewEditAd').show(); break;
       }
   }

   //Attach Events
    $('#linkHome').click(() => showView('home'));
    $('#linkListAds').click(() => showView('ads'));
    $('#linkCreateAd').click(() => showView('create'));
    $('#linkLogin').click(() => showView('login'));
    $('#linkRegister').click(() => showView('register'));
    $('#linkLogout').click(logout);

   $('#buttonLoginUser').click(login);
   $('#buttonRegisterUser').click(register);
   $('#buttonCreateAd').click(createAd);

   $(document).on({
       ajaxStart: () => $('#loadingBox').show(),
       ajaxStop: () => $('#loadingBox').fadeOut()
   });

   $('#infoBox').click(event => $(event.target).hide());
   $('#errorBox').click(event => $(event.target).hide());

   function showInfo(message){
      let infoBox = $('#infoBox');
      infoBox.text(message);
      infoBox.show();
      setTimeout(() => infoBox.fadeOut(), 3000);
   }

    function showError(message){
        let errorBox = $('#errorBox');
        errorBox.text(message);
        errorBox.show();
    }

    function handleError(reason){
        showError(reason.responseJSON.description);
    }

    if(localStorage.getItem('authtoken') !== null && localStorage.getItem('username') !== null){
        userLoggedIn();
    } else {
        userLoggedOut()
    }
    showView('home');

    function userLoggedIn(){
        let greetingsSpan = $('#loggedInUser');
        greetingsSpan.text(`Welcome, ${localStorage.getItem('username')}!`);
        greetingsSpan.show();
        $('#linkLogin').hide();
        $('#linkRegister').hide();
        $('#linkListAds').show();
        $('#linkCreateAd').show();
        $('#linkLogout').show();
    }

    function userLoggedOut(){
        let greetingsSpan = $('#loggedInUser');
        greetingsSpan.text('');
        greetingsSpan.hide();
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#linkListAds').hide();
        $('#linkCreateAd').hide();
        $('#linkLogout').hide();
    }

    function saveSession(data){
        localStorage.setItem('username', data.username);
        localStorage.setItem('id', data._id);
        localStorage.setItem('authtoken', data._kmd.authtoken);
        userLoggedIn();
    }

    let requester = (() => {
       const baseUrl = 'https://baas.kinvey.com/';
       const appKey = 'kid_BJEmdLdPb';
       const appSecret = '1951ebf91deb4ffd802c4b58c42c20cc';

       function makeAuth(type){
           if(type === 'basic') return 'Basic ' + btoa(appKey + ':' + appSecret);
           else return 'Kinvey ' + localStorage.getItem('authtoken');
       }

       function request(method, module, url, auth) {
           return req = {
               url: baseUrl + module + '/' + appKey + '/' + url,
               method: method,
               headers: {
                   'Authorization': makeAuth(auth)
               }
           }
       }

       function get(module, url, auth){
           return $.ajax(request("GET", module, url, auth));
       }

       function post(module, url, data, auth){
           let req = request("POST", module, url, auth);
           req.data = JSON.stringify(data);
           req.headers['Content-Type'] = 'application/json';
           return $.ajax(req);
       }

       function update(module, url, data, auth){
           let req = request("PUT", module, url, auth);
           req.data = JSON.stringify(data);
           req.headers['Content-Type'] = 'application/json';
           return $.ajax(req);
       }

       function remove(module, url, data, auth){
           return $.ajax(request("DELETE", module, url, auth));
       }

        return {
           get, post, update, remove
        }
   })();

    async function login(){
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try{
            let data = await  requester.post('user', 'login', {username, password}, 'basic');
            saveSession(data);
            showInfo('Logged in.');
            showView('ads');
        } catch (err){
          handleError(err);
        }

    }

    async function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try{
            let data = await  requester.post('user', '', {username, password}, 'basic');
            saveSession(data);
            showInfo('Registered.');
            showView('ads');
        } catch (err){
            handleError(err);
        }
    }

    async function logout(){
        try{
            let data = await  requester.post('user', '_logout', {authtoken: localStorage.getItem('authtoken')});
            localStorage.clear();
            showView('home');
            showInfo('Logged out.');
            userLoggedOut();
        } catch (err){
            handleError(err);
        }
    }

    async function loadAds(){
       let data = await requester.get('appdata', 'posts');
       adsDiv.empty();
       if(data.length === 0){
           adsDiv.append('<p>No ads in database</p>')
           return;
       }

       for (let ad of data) {
           let html = $('<div>').addClass('ad-box');
           let title = $(`<div class="ad-title">`);
           title.append(`<a href="#" class="productTitle">${ad.title}</a>`).click(() => showAd(ad._id));
           if (ad._acl.creator === localStorage.getItem('id')) {
               let deleteBtn = $('<button>&#10006;</button>').click(() => deleteAd(ad._id));
               deleteBtn.addClass('ad-control');
               deleteBtn.appendTo(title);
               let editBtn = $('<button>&#9998;</button>').click(() => LoadEditForm(ad));
               editBtn.addClass('ad-control');
               editBtn.appendTo(title);
            }
           let viewBtn = $('<button>&#x1f441;</button>').click(() => showAd(ad._id));
           viewBtn.addClass('ad-control');
           viewBtn.appendTo(title);
           html.append(title);
           html.append(`<div><img src="${ad.imageUrl}"></div>`);
           html.append(`<div>Price: ${ad.price.toFixed(2)} | By ${ad.publisher}</div>`);
           adsDiv.append(html);
       }

    }

    async function createAd(){
        let form = $('#formCreateAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = Number(form.find('input[name="price"]').val());
        let imageUrl = form.find('input[name="image"]').val();
        let date = new Date();
        let publisher = localStorage.getItem('username');
        if(title.length === 0){
            showError('Title cannot be empty!');
            return;
        }

        if(Number.isNaN(price) || price <= 0){
            showError('Invalid price!');
            return;
        }

        let newAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.post('appdata', 'posts', newAd);
            showInfo('Ad created.');
            showView('ads');
        } catch (err) {
            handleError(err)
        }

    }

    async function deleteAd(id){
        await requester.remove('appdata', 'posts/' + id);
        showInfo('Ad deleted');
        showView('ads');
    }

    function LoadEditForm(ad){
        let form = $('#formEditAd');
        let title = form.find('input[name="title"]').val(ad.title);
        let description = form.find('textarea[name="description"]').text(ad.description);
        let price = Number(form.find('input[name="price"]').val(Number(ad.price)));
        let imageUrl = form.find('input[name="image"]').val(ad.imageUrl);
        let date = ad.date;
        let publisher = ad.publisher;
        let id = ad._id;

        form.find('#buttonEditAd').click(()=> editAd(id, date, publisher));
        showView('edit');
    }

    async function editAd(id, date, publisher){
        let form = $('#formEditAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = Number(form.find('input[name="price"]').val());
        let imageUrl = form.find('input[name="image"]').val();

        if(Number.isNaN(price) && price <= 0){
            showError('Invalid price!');
            return;
        }

        let editedAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.update('appdata', 'posts/' + id, editedAd);
            showInfo('Ad edited.');
            showView('ads');
        } catch (err) {
            handleError(err)
        }
    }

    async function showAd(id){
        let ad = await requester.get('appdata', 'posts/' + id);
            adsDiv.empty();
        if(ad.length === 0){
            adsDiv.append('<p>Ad were not found</p>');
            return;
        }
            let html = $('<div>').addClass('ad-singleBox');
            let title = $(`<div class="ad-title">`);
            title.append(`<a href="#" class="productTitle">${ad.title}</a>`).click(() => showAd(ad._id));
            if (ad._acl.creator === localStorage.getItem('id')) {
                let deleteBtn = $('<button>&#10006;</button>').click(() => deleteAd(ad._id));
                deleteBtn.addClass('ad-control');
                deleteBtn.appendTo(title);
                let editBtn = $('<button>&#9998;</button>').click(() => LoadEditForm(ad));
                editBtn.addClass('ad-control');
                editBtn.appendTo(title);
            }
            html.append(title);
            html.append(`<div><img src="${ad.imageUrl}"></div>`);
            html.append(`<div>Price: ${ad.price.toFixed(2)} | By ${ad.publisher} | on ${formatDate(ad.date)}</div>`);
            html.append(`<div class="ad-description">${ad.description}</div>`);
            adsDiv.append(html);
    }

    function formatDate(date){
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        let days =
            [   '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
                '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th',
                '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th', '31st' ];

        let result = new Date(date);
        return days[result.getDate() -1] + " " + monthNames[result.getMonth()] ;
    }
}