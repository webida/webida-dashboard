$(function () {
    var Works = {
        'workspaces': [{
            'name': 'Workspace #1',
            'projects': [{
                'name': 'Project #1',
                'type': 'Web',
                'deploys': [{
                    'name': 'Project #1 - Deploy #1',
                    'type': 'Web Deploy'
                }, {
                    'name': 'Project #1 - Deploy #2',
                    'type': 'Web Deploy'
                }]
            }, {
                'name': 'Project #2',
                'type': 'Php',
                'deploys': [{
                    'name': 'Project #2- Deploy #1',
                    'type': 'Php Deploy'
                }]
            }]
        }],
        refresh: function () {}
    };

    var App = {
        init: function () {
            this.cacheElements();
            this.bindEvents();
            $.setPageContainer('#page-container');
        },
        cacheElements: function () {
            // templates
            // widgets
            this.containerPage = $('#container-page');
            this.dashboardPage = $('#dashboard-page');
            this.workspacePage = $('#workspace-page');
            this.settingsPage = $('#settings-page');
        },
        bindEvents: function () {
            this.workspacePage.on('page-on', function(e, hash, param) {
            });
        },
        render: function () {

        },
        
    };

    App.init();
});