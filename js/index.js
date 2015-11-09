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
    'guest',
    'ModalFactory',
    'notify',
    'services/Auth',
    'services/FS'
], function (appConfig, guest, ModalFactory, notify, Auth, FS) {
    'use strict';

    jQuery.fn.closeModal = function () {
        if (this.attr('role') !== 'dialog') {
            throw this.selector + ' is not a dialog';
        }
        this.find('button.close').click();
    };

    var app = {
        isValidEmail: false,
        
        init: function () {
            this.checkLogin();
            this.cacheElements();
            this.bindEvents();
        },

        checkLogin: function () {
            Auth.initAuth();
            Auth.getLoginStatusOnce().then(function () {
                Auth.getMyInfo(true).then(function (info) {
                    if (info.isGuest) {
                        FS.getFSId().then(function (fsid) {
                            location.href = appConfig.ideBaseUrl + '/apps/ide/src/index.html?workspace=' +
                                fsid + '/guest';
                        }).fail(function (e) {
                            console.log('getFSId fail', e);
                        });
                    } else {
                        location.href = 'main.html';
                    }
                });
            }).catch(function () {
                console.log('not logged in.');
                app.setOnlineView();
            });
        },

        cacheElements: function () {
            // page widgets
            this.$loginButton = $('button.login');
            this.$newAccountButton = $('button.new-account');

            // Modal
            this.$newAccountModal = $('#new-account');
            this.$newAccountEmail = $('#new-account-email');
            this.$newAccountCreateButton = this.$newAccountModal.find('button.create');

            this.$denyNewAccountModal = $('#deny-new-account');

            /* jshint newcap: false */
            this.signingUpModal = ModalFactory('#common-modal', '#common-modal-template');
            /* jshint newcap: true */
        },

        bindEvents: function () {
            this.$loginButton.on('click', function () {
                location.href = Auth.getLoginUrl();
            });

            this.$newAccountModal.on('hidden.bs.modal', function () {
                app.$newAccountEmail.val('');
                app.$newAccountCreateButton.removeAttr('disabled');
            });

            this.$newAccountButton.on('click', function () {
                if (appConfig.signUpEnable) {
                    app.$newAccountModal.modal();
                } else {
                    app.$denyNewAccountModal.modal();
                }
            });

            this.$newAccountEmail.on('keypress', function (e) {
                if (e.keyCode === 13 && app.isValidEmail) { // Enter
                    app.$newAccountCreateButton.click();
                }
            });
            
            this.$newAccountEmail.on('input', function () {
                var email = app.$newAccountEmail.val();
                var emailExp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                
                if (emailExp.test(email)) { // valid
                    app.$newAccountCreateButton.removeAttr('disabled');
                    app.isValidEmail = true;
                } else {
                    app.$newAccountCreateButton.attr('disabled', '');
                    app.isValidEmail = false;
                }
            });

            this.$newAccountCreateButton.on('click', function () {
                app.$newAccountCreateButton.attr('disabled', '');

                var email = app.$newAccountEmail.val();
                Auth.createAccount(email).then(function () {
                    app.$newAccountModal.closeModal();
                    app.signingUpModal.popup();
                }).catch(function (e) {
                    app.$newAccountCreateButton.removeAttr('disabled');
                    notify.error(e.message);
                });
            });

            this.signingUpModal.setup({
                title: 'Thank you for signing up!',
                message: 'Please check your email for the confirmation request with a link that' +
                    ' will validate your account. Once you click the link, your registration will be complete. ',
                buttons: [{
                    id: 'signingup-ok-button',
                    name: 'Ok',
                    default: true,
                    close: true
                }]
            });
        },

        setOnlineView: function () {
            $('#account-menu').removeClass('webida-hidden');
        },
    };


    $(function () {
        app.init();
        // for debugging
        window.app = app;
    });
});
