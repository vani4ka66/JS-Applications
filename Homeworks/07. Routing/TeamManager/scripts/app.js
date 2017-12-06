$(() => {
    const app = Sammy('#main', function () {
        this.use('Handlebars', 'hbs');
        
        this.get('index.html', displayHome);

        this.get("#/home", displayHome);

        function displayHome(context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');
            //let teamId = context.params.id.substr(1);

            context.hasTeam = sessionStorage.getItem('teamId') !== 'undefined' || sessionStorage.getItem('teamId') !== null;
            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/home/home.hbs')
            });
        };

        this.get('#/about', function (context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');
            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('templates/about/about.hbs')
            });
        });
        
        this.get('#/login', function (context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');
            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                loginForm: './templates/login/loginForm.hbs'
            }).then(function () {
                this.partial('templates/login/loginPage.hbs')
            });
        });

        this.post('#/login', (context) => {
            let username = context.params.username;
            let password = context.params.password;
            auth.login(username, password)
                .then(function (data) {
                    auth.saveSession(data);
                    auth.showInfo('Logged In!');
                    displayHome(context);
                }).catch(auth.handleError);
        });

        this.get('#/register', function (context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');
            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                registerForm: './templates/register/registerForm.hbs'
            }).then(function () {
                this.partial('./templates/register/registerPage.hbs')
            });
        });
        
        this.post('#/register', function (context) {
            let username = context.params.username;
            let password = context.params.password;
            let repeatPassword = context.params.repeatPassword;

            if(password !== repeatPassword){
                auth.showError('Passwords do not match');
            }
            else {
                auth.register(username, password)
                    .then(function (data) {
                        auth.saveSession(data);
                        auth.showInfo('Registered!')
                        displayHome(context);
                    }).catch(auth.handleError);
            }

        })

        this.get('#/logout', function (context) {
            auth.logout()
                .then(() => {
                    sessionStorage.clear();
                    auth.showInfo('Logged Out!')
                    displayHome(context);
                }).catch(auth.handleError);
        });

        this.get('#/catalog', displayCatalog);

        function displayCatalog(context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');

            teamsService.loadTeams()
                .then(function (teams) {
                    context.hasNoTeam = sessionStorage.getItem('teamId') === 'undefined' || sessionStorage.getItem('teamId') === null;
                    context.teams = teams;

                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        team: './templates/catalog/team.hbs'
                    }).then(function () {
                        this.partial('templates/catalog/teamCatalog.hbs');
                    });
                })
        }

        this.get('#/create', function (context) {
            context.loggedIn = sessionStorage.getItem('authtoken') !== null;
            context.username = sessionStorage.getItem('username');

            context.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                createForm: './templates/create/createForm.hbs'
            }).then(function () {
                this.partial('./templates/create/createPage.hbs')
            });
        })

        this.post('#/create', function (context) {
            let teamName = context.params.name;
            let teamComment = context.params.comment;

            teamsService.createTeam(teamName, teamComment)
                .then(function (teamInfo) {
                    teamsService.joinTeam(teamInfo._id)
                        .then(function (userInfo) {
                            auth.saveSession(userInfo);
                            auth.showInfo(`Team ${teamName} created`);
                            displayCatalog(context);
                        }).catch(auth.handleError);
                }).catch(auth.handleError);
        })

        this.get('#/catalog/:id', function (context) {
            let teamId = context.params.id.substr(1);

            teamsService.loadTeamDetails(teamId)
                .then(function (teamInfo) {
                    context.loggedIn = sessionStorage.getItem('authtoken') !== null;
                    context.username = sessionStorage.getItem('username');
                    context.teamId = teamId;
                    context.name = teamInfo.name;
                    context.comment = teamInfo.comment;
                    context.isOnTeam = teamInfo._id === sessionStorage.getItem('teamId');
                    context.isAuthor = teamInfo._acl.creator === sessionStorage.getItem('userId');

                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        teamControls: './templates/catalog/teamControls.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/details.hbs')
                    }).catch(auth.handleError);
                });

        })

        this.get('#/join/:id', function (context) {
            let teamId = context.params.id.substr(1);

            teamsService.joinTeam(teamId)
                .then(function (userInfo) {
                    auth.saveSession(userInfo);
                    auth.showInfo('Joined Team!')
                    displayCatalog(context);
                }).catch(auth.handleError);
        });

        this.get('#/leave', function (context) {
            teamsService.leaveTeam()
                .then(function (userInfo) {
                    auth.saveSession(userInfo);
                    auth.showInfo('Left the Team');
                    displayCatalog(context);
                }).catch(auth.handleError);
        })

        this.get('#/edit/:id', function (context) {
            let teamId = context.params.id.substr(1);

            teamsService.loadTeamDetails(teamId)
                .then(function (teamInfo) {
                    context.teamId = teamId;
                    context.name = teamInfo.name;
                    context.comment = teamInfo.comment;

                    context.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        editForm: './templates/edit/editForm.hbs'
                    }).then(function () {
                        this.partial('./templates/edit/editPage.hbs')
                    });

                }).catch(auth.handleError);
        });

        this.post('#/edit/:id', function (context) {
            let teamId = context.params.id.substr(1);
            let teamName = context.params.name;
            let teamComment = context.params.comment;

            teamsService.edit(teamId, teamName, teamComment)
                .then(function () {
                    auth.showInfo(`Team ${teamName} Edited!`);
                    displayCatalog(context);
                }).catch(auth.handleError);
        })




    });

    app.run();
});