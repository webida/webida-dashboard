/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require([
    'app-config',
    'app-data',
    'notify',
    'services/Auth',
    'services/FS',
    'load-polyfills'
], function (appConfig, appData, notify, Auth, Fs, loadPolyfills) {
    'use strict';

    console.log('required');

    jQuery.fn.closeModal = function () {
        if (this.attr('role') !== 'dialog') {
            throw this.selector + ' is not a dialog';
        }
        this.find('button.close').click();
    };

    var app = {
        init: function () {
            var self = this;
            Auth.init().then(function () {
                Fs.init().then(function () {
                    console.log('FS initialized');
                    self.checkLogin();
                    self.loadControllers();
                    self.cacheElements();
                    self.bindEvents();

                    // for debugging
                    window.app = self;
                });
            });
        },

        checkLogin: function () {
            Auth.getLoginStatus().catch(function () {
                location.href = '/index.html';
            }).then(function (user) {
                $('#user-email').text(user.email);
                $('#user-email').attr('title', user.email);
                require(['controllers/ProfileController'], function (ProfileController) {
                    ProfileController.init(user);
                    // for debugging
                    window.PC = ProfileController;
                });
                require(['controllers/AccountController'], function (AccountController) {
                    AccountController.init(user);
                    // for debugging
                    window.AC = AccountController;
                });
                app.setOnlineView();
            });
        },
        
        loadControllers: function () {
            require(['controllers/WorkspaceController'], function (WorkspaceController) {
                WorkspaceController.init();
                // for debugging
                window.WC = WorkspaceController;
            });
            require(['controllers/SettingsController'], function (settingsController) {
                settingsController.init();
                // for debugging
                window.SC = settingsController;
            });
        },

        cacheElements: function () {
            console.log('cacheElements');
            // templates
            // widgets
            app.$wrapper = $('#wrapper');
            app.$logoutButton = app.$wrapper.find('#logout-button');
            // modals
        },
        
        bindEvents: function () {
            app.$logoutButton.on('click', function () {
                Auth.logout().then(function () {
                    location.href = '/index.html';
                }).catch(function (e) {
                    notify.alert(e);
                });
            });
        },

        setOnlineView: function () {
            $('#account-menu').removeClass('webida-hidden');
        },
    };

    $(function () {
        loadPolyfills.load(function () {
            app.init();
        });
    });

    /* jshint ignore:start */ // no need to check coding convention on google's obfuscated code
    if(appConfig.googleAnalytics) {
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create',appConfig.googleAnalytics, 'auto');
        ga('send', 'pageview');
    }
    /* jshint ignore:end */ 
});
