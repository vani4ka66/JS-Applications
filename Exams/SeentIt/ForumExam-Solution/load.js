//(() => {
function myApp() {

    //localStorage.clear();

    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_HJZQjWPOW';
    const appSecret = '105f6cddeaa94ccb91e55287a2c800de';


    if (localStorage.getItem('username')) {
        $('#spanLoggedInUser').text(localStorage.getItem('username'));
        showView('catalog');
    }
    else {
        $('#menu').hide();
        $('#profile').hide();
        showView('welcome')
    }


    $('#linkCatalog').click(() => showView('catalog'));
    $('#linkSubmitLink').click(() => showView('submitLink'));
    $('#linkMyPosts').click(() => showView('myPosts'));

    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').hide()
    });

    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());

    //buttons
    let registerSubmit = $('#registerForm').find('input[type=submit]');
    registerSubmit.click(register);

    let loginSubmit = $('#loginForm').find('input[type=submit]');
    loginSubmit.click(login);

    $('#logoutBtn').click(logout);

    let submitBtn = $('#viewSubmit').find('input[type=submit]');
    submitBtn.click(submitFunc);


    function showView(view) {
        $('section').hide();
        switch (view) {
            case 'welcome':
                $('#viewWelcome').show();
                break;
            case 'catalog':
                loadCatalog();
                $('#viewCatalog').show();
                break;
            case 'submitLink':
                $('#viewSubmit').show();
                break;
            case 'myPosts':
                myPosts();
                $('#viewMyPosts').show();
                break;
            case 'edit':
                $('#viewEdit').show();
                break;
            case 'comment':
                viewDetails();
                $('#viewComments').show();
                break;

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

    function loadCatalog() {

        $.ajax({
            url: baseUrl + "appdata/" + appKey + '/posts?query={}&sort={"_kmd.ect": -1}',
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayPosts,
            error: handleError
        });

        function displayPosts(data) {
            let count = 1;
            let divCatalog = $('#viewCatalog').find('.posts');
            divCatalog.empty();

            for (let element of data) {
                let article = $('<article class="post">');
                let rank = $('<div class="col rank">');
                let span1 = $(`<span>${count++}</span>`);
                rank.append(span1);

                let thumbNail = $('<div class="col thumbnail">');
                let ahref = $(`<a href="${element.url}">`);
                let img = $(`<img src="${element.imageUrl}">`);
                ahref.append(img);
                thumbNail.append(ahref);

                let divContent = $('<div class="post-content">');
                let divTitle = $('<div class="title">');
                let href = $(`<a href="${element.url}">`).text(`${element.title}`);
                divTitle.append(href);

                let divDetails = $('<div class="details">');
                let info = $('<div class="info">').text(`submitted ${calcTime(element._kmd.ect)} ago by ${element.author}`);
                let control = $('<div class="controls">');
                let ul = $('<ul>');
                let licomments = $('<li class="action"><a class="commentsLink" href="#">comments</a></li>');
                licomments.click(() => viewDetails(element));
                ul.append(licomments);

                if (localStorage.getItem('username') === element.author) {
                    let liEdit = $('<li class="action"><a class="editLink" href="#">edit</a></li>');
                    liEdit.click(() => openEditForm(element));

                    let liDelete = $('<li class="action"><a class="deleteLink" href="#">delete</a></li>');
                    liDelete.click(() => deletePost(element._id));

                    ul.append(liEdit).append(liDelete);
                }

                control.append(ul);
                divDetails.append(info).append(control);

                divContent.append(divTitle).append(divDetails);
                article.append(rank).append(thumbNail).append(divContent);
                divCatalog.append(article);
            }

        }

    }

    function calcTime(dateIsoFormat) {
        let diff = new Date - (new Date(dateIsoFormat));
        diff = Math.floor(diff / 60000);
        if (diff < 1) return 'less than a minute';
        if (diff < 60) return diff + ' minute' + pluralize(diff);
        diff = Math.floor(diff / 60);
        if (diff < 24) return diff + ' hour' + pluralize(diff);
        diff = Math.floor(diff / 24);
        if (diff < 30) return diff + ' day' + pluralize(diff);
        diff = Math.floor(diff / 30);
        if (diff < 12) return diff + ' month' + pluralize(diff);
        diff = Math.floor(diff / 12);
        return diff + ' year' + pluralize(diff);

        function pluralize(value) {
            if (value !== 1) return 's';
            else return '';
        }
    }

    function submitFunc(ev) {
        ev.preventDefault();
        let form = $('#submitForm');
        let url = form.find('input[name="url"]').val();
        let title = form.find('input[name="title"]').val();
        let imageUrl = form.find('input[name="image"]').val();
        let description = form.find('input[name="comment"]').val();
        let author = localStorage.getItem('username');

        let post = {
            author,
            title,
            url,
            imageUrl,
            description
        };
        console.log(post);

        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/posts",
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(post),
            success: (() => {
                showInfo('Post created!'),
                    showView('catalog')
            }),
            error: handleError
        });
    }

    function openEditForm(element) {
        let viewEdit = $('#editPostForm');
        viewEdit.find('input[name="url"]').val(element.url);
        viewEdit.find('input[name="title"]').val(element.title);
        viewEdit.find('input[name="image"]').val(element.imageUrl);
        viewEdit.find('input[name="description"]').val(element.description);

        let editBtn = $('#editPostForm').find('input[type=submit]');
        editBtn.click(() => updatePost(element._id));

        showView('edit');

    }

    function updatePost(id, ev) {
        ev.preventDefault();
        let viewEdit = $('#editPostForm');
        let url = viewEdit.find('input[name="url"]').val();
        let title = viewEdit.find('input[name="title"]').val();
        let imageUrl = viewEdit.find('input[name="image"]').val();
        let description = viewEdit.find('input[name="description"]').val();
        let author = localStorage.getItem('username');


        $.ajax({
            method: "PUT",
            url: baseUrl + "appdata/" + appKey + "/posts/" + id,
            headers: {
                "Authorization": "Kinvey " + localStorage.getItem('authtoken')
            },
            contentType: "application/json",
            data: JSON.stringify({
                url,
                title,
                imageUrl,
                description,
                author
            }),
            success: (() => {
                showInfo('Post updated!'),
                    showView('catalog')
            }),
            error: handleError
        });

    }

    function deletePost(id) {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + '/posts/' + id,
            method: "DELETE",
            headers: {
                "Authorization": "Kinvey " + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: (() => {
                showView('catalog'),
                    showInfo('Post deleted!')
            }),
            error: handleError
        })
    }

    function myPosts() {
        $.ajax({
            url: baseUrl + "appdata/" + appKey + `/posts?query={"author":"${localStorage.getItem('username')}"}&sort={"_kmd.ect": -1}`,
            method: "GET",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            success: displayMyPosts,
            error: handleError
        });

        function displayMyPosts(data) {
            let count = 1;
            let divCatalog = $('#viewMyPosts').find('.posts');
            divCatalog.empty();

            for (let element of data) {
                let article = $('<article class="post">');
                let rank = $('<div class="col rank">');
                let span1 = $(`<span>${count++}</span>`);
                rank.append(span1);

                let thumbNail = $('<div class="col thumbnail">');
                let ahref = $(`<a href="${element.url}">`);
                let img = $(`<img src="${element.imageUrl}">`);
                ahref.append(img);
                thumbNail.append(ahref);

                let divContent = $('<div class="post-content">');
                let divTitle = $('<div class="title">');
                let href = $(`<a href="${element.url}">`).text(`${element.title}`);
                divTitle.append(href);

                let divDetails = $('<div class="details">');
                let info = $('<div class="info">').text(`submitted ${calcTime(element._kmd.ect)} days age by ${element.author}`);
                let control = $('<div class="controls">');
                let ul = $('<ul>');
                let licomments = $('<li class="action"><a class="commentsLink" href="#">comments</a></li>');
                licomments.click(() => viewDetails(element));
                let liEdit = $('<li class="action"><a class="editLink" href="#">edit</a></li>');
                liEdit.click(() => openEditForm(element))
                let liDelete = $('<li class="action"><a class="deleteLink" href="#">delete</a></li>');
                liDelete.click(() => deletePost(element._id));
                ul.append(licomments).append(liEdit).append(liDelete);
                control.append(ul);
                divDetails.append(info).append(control);

                divContent.append(divTitle).append(divDetails);
                article.append(rank).append(thumbNail).append(divContent);
                    divCatalog.append(article);

            }
        }
    }

    function viewDetails(element) {
        let divMain = $('#viewComments');
        let divCatalog = $('#viewComments').find('.post');
        divCatalog.empty();

        let thumbNail = $('<div class="col thumbnail">');
        let ahref = $(`<a href="${element.url}">`);
        let img = $(`<img src="${element.imageUrl}">`);
        ahref.append(img);
        thumbNail.append(ahref);

        let divContent = $('<div class="post-content">');
        let divTitle = $('<div class="title">');
        let href = $(`<a href="${element.url}">`).text(`${element.title}`);
        divTitle.append(href);

        let divDetails = $('<div class="details">');
        let info = $('<div class="info">').text(`submitted ${calcTime(element._kmd.ect)} days age by ${element.author}`);
        let control = $('<div class="controls">');
        let ul = $('<ul>');
        let liEdit = $('<li class="action"><a class="editLink" href="#">edit</a></li>');
        liEdit.click(() => openEditForm(element))
        let liDelete = $('<li class="action"><a class="deleteLink" href="#">delete</a></li>');
        liDelete.click(() => deletePost(element._id));
        ul.append(liEdit).append(liDelete);
        control.append(ul);
        divDetails.append(info).append(control);
        let clear = ' <div class="clear"></div>';

        divContent.append(divTitle).append(divDetails).append(clear);
        divCatalog.append(thumbNail).append(divContent);

        let formPostCommentdiv = $('<div class="post post-content">');
        let formContent = $('<form id="commentForm">');
        let lable = $('<label>Comment</label>');
        let textArea = $('<textarea name="content" type="text"></textarea>');
        let input = $('<input type="submit" value="Add Comment" id="btnPostComment">');
        $('#btnPostComment').click(() => addComment(element._id));

        formContent.append(lable).append(textArea).append(input);
        formPostCommentdiv.append(formContent);
        divMain.append(formPostCommentdiv);

    }

    function addComment(postId) {
        let comment = {
            author: localStorage.getItem('username'),
            content: $('#commentForm').find('#commentContent').val(),
            postId: postId
        };

        if (comment.content === '') {
            showError('Content box cannot be empty');
            return;
        }
        ;

        $.ajax({
            url: baseUrl + "appdata/" + appKey + "/comments",
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(comment),
            success: (() => {
                showInfo('Message sent!'),
                    showView('archiv')
            }),
            error: handleError
        });
    }

    function login(ev) {
        ev.preventDefault();
        let form = $('#loginForm');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();

        if(username === '' || password === ''){

        }
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
            //setGreeting();
            showView('catalog');
        }
    }

    function register(ev) {
        ev.preventDefault();
        let form = $('#registerForm');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();
        let repeatPass = form.find('input[name="repeatPass"]').val();


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
            }),
            success: registerSuccess,
            error: handleError
        });

        function registerSuccess(data) {
            console.log(data)
            showInfo('Registration successful');
            localStorage.setItem('username', data.username);
            localStorage.setItem('id', data._id);
            localStorage.setItem('authtoken', data._kmd.authtoken);

            //setGreeting();
            showView('catalog');
        }

    }

    function logout() {
        $.ajax({
            url: baseUrl + 'user/' + appKey + '/_logout',
            method: "POST",
            headers: {
                'Authorization': 'Kinvey ' + localStorage.getItem('authtoken'),
            },
            success: logoutSuccess,
            error: handleError
        });

        function logoutSuccess(data) {
            localStorage.clear();
            //setGreeting();
            showView('welcome');
        }

    }

    function handleError(response) {
        //showError(err.responseJSON.description)
        //showError(error.message)
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        //alert(errorMsg);
        showError(errorMsg);
    };



}

//})()