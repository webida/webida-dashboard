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
    'services/Auth',
    'notify',
], function (appConfig, appData, Auth, notify) {
    'use strict';

    console.log('required');
    //var WORKSPACE_PATH = '/';
    //var fsid = null;

    jQuery.fn.closeModal = function () {
        if (this.attr('role') !== 'dialog') {
            throw this.selector + ' is not a dialog';
        }
        this.find('button.close').click();
    };

    var app = {
        checkLogin: function () {
            Auth.initAuth();
            Auth.getLoginStatusOnce().catch(function () {
                location.href = '/index.html';
            }).then(function (user) {
                $('#user-email').text(user.email);
                require(['controllers/ProfileController'], function (ProfileController) {
                    ProfileController.init(user);
                    // for debugging
                    window.PC = ProfileController;
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

        init: function () {
            this.checkLogin();
            this.loadControllers();
            this.cacheElements();
            this.bindEvents();

            // for debugging
            window.app = this;
        },
        
        cacheElements: function () {
            console.log('cacheElements');
            // templates
            // widgets
            app.$wrapper = $('#wrapper');
            app.$workspacePage = app.$wrapper.find('#workspaces-page');
            app.$settingsPage = app.$wrapper.find('#settings-page');
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
        console.log('onload');
        app.init();
    });
});
