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

define([
    'app-config',
    'services/Auth',
    'services/SettingsManager',
    'ModalFactory'
], function (appConfig, Auth, SettingsManager, ModalFactory) {
    'use strict';

    var SettingsController = {
        settings: {
            publicSSHKey: undefined,
            githubToken: undefined,
            personalTokens: []
        },

        init: function () {
            this.cacheElement();
            this.eventBinding();
            this.loadSettings().then(function () {
                self.renderSettings();
            });
        },

        cacheElement: function () {
            // templates
            this.$personalTokenTemplate = Handlebars.compile($('#personal-token-template').html());
            // page widgets
            this.$wrapper = $('#wrapper');
            this.$settingsPage = this.$wrapper.find('#settings-page');

            this.$publicSSHKeyPanel = this.$wrapper.find('#ssh-key-panel');
            this.$publicSSHKey = this.$publicSSHKeyPanel.find('#public-ssh-key');
            this.$generateNewKeyButton = this.$publicSSHKeyPanel.find('button.generate');

            this.$githubTokenPanel = this.$wrapper.find('#github-token-panel');
            this.$githubToken = this.$githubTokenPanel.find('#github-token');
            this.$saveTokenButton = this.$githubTokenPanel.find('button.save');

            this.$personalTokenPanel = this.$wrapper.find('#personal-token-panel');
            this.$personalTokenTable = this.$personalTokenPanel.find('#personal-token-table');
            this.$addNewPersonalTokenButton = this.$personalTokenPanel.find('button.add-new');
            // modal widgets
            // modal
            this.generateNewKeyModal = ModalFactory('#common-modal', '#common-modal-template');
        },

        eventBinding: function () {

            this.generateNewKeyModal.setup({
                title: 'Generate New Key',
                message: 'The previous public ssh key will be replaced with a new one! Are you sure to continue?',
                buttons: [{
                    id: 'generate-yes-button',
                    name: 'Yes',
                    class: 'btn btn-danger',
                    onclick: function (e) {
                        self.generatePublicSSHKey();
                    }
                }, {
                    name: 'No',
                    default: true,
                    close: true,
                }]
            });

            this.$generateNewKeyButton.on('click', function (e) {
                console.log('click');
                self.generateNewKeyModal.popup().then(function (button) {
                    console.log(button);
                });
            });

            this.$githubToken.on('keypress', function (e) {
                if (e.keyCode === 13) { // Enter
                    self.$saveTokenButton.click();
                }
            });

            this.$githubToken.on('keyup', function (e) {
                if (self.$githubToken.val() == self.settings.githubToken) {
                    self.$saveTokenButton.attr('disabled', '');
                } else {
                    self.$saveTokenButton.removeAttr('disabled');
                }
            });

            this.$saveTokenButton.on('click', function (e) {
                self.saveGithubToken();
            });

            this.$addNewPersonalTokenButton.on('click', function (e) {
                SettingsManager.addNewPersonalToken().then(function (token) {
                    return SettingsManager.getPersonalTokens();
                }).then(function (tokens) {
                    console.log('tokens', tokens);
                    self.settings.personalTokens = tokens;
                    self.renderPersonalTokenTable();
                }).catch(function (e) {
                    alert(e);
                });
            });

            this.$personalTokenTable.delegate('a.delete-token', 'click', function (e) {
                var token = $(this).attr('data-token');
                SettingsManager.deletePersonalToken(token).then(function () {
                    return self.loadPersonalTokens();
                }).then(function () {
                    self.renderPersonalTokenTable();
                }).catch(function (e) {
                    alert(e);
                });
            });
        },

        loadSettings: function () {
            return new Promise(function (resolve, reject) {
                Auth.getLoginStatusOnce().then(function () {
                    return Auth.initAuthOnce();
                }).then(function () {
                    Promise.all([self.loadPublicSSHKey(),
                                 self.loadGitHubToken(),
                                 self.loadPersonalTokens()
                                ]).then(function (values) {
                        resolve();
                    }).catch(function (e) {
                        alert(e);
                        reject(e);
                    });
                }).catch(function (e) {
                    alert(e);
                    reject(e);
                });
            });
        },

        loadPublicSSHKey: function () {
            return new Promise(function (resolve, reject) {
                SettingsManager.getPublicSSHKey().then(function (key) {
                    self.settings.publicSSHKey = key;
                    resolve();
                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        loadGitHubToken: function () {
            return new Promise(function (resolve, reject) {
                SettingsManager.getGitHubToken().then(function (token) {
                    self.settings.githubToken = token;
                    resolve();
                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        loadPersonalTokens: function () {
            return new Promise(function (resolve, reject) {
                SettingsManager.getPersonalTokens().then(function (tokens) {
                    self.settings.personalTokens = tokens;
                    resolve();
                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        generatePublicSSHKey: function() {
            var buttonObj = $('#' + this.id);
            console.log('Yes');
            buttonObj.attr('disabled', '');
            SettingsManager.removePublicSSHKey().then(function (info) {
                return SettingsManager.generatePublicSSHKey();
            }).then(function (info) {
                return SettingsManager.getPublicSSHKey();
            }).then(function (key) {
                console.log('key', key);
                self.settings.publicSSHKey = key;
                self.renderPublicSSHKey();
                self.notify('Info', 'New public SSH key generated successfully');
            }).catch(function (e) {
                self.notify('Error', e, 'danger');
                alert(e);
            }).then(function () {
                buttonObj.removeAttr('disabled');
                self.generateNewKeyModal.close();
            });
        },

        saveGithubToken: function() {
            self.$saveTokenButton.removeAttr('disabled');
            var token = self.$githubToken.val();

            SettingsManager.setGitHubToken(token).then(function () {
                return SettingsManager.getGitHubToken();
            }).then(function (token) {
                self.settings.githubToken = token;
                self.renderGithubToken();
                self.notify('Info', 'GitHub token saved successfully');
            }).catch(function (e) {
                self.notify('Error', e, 'danger');
            });
        },

        renderSettings: function () {
            this.renderPublicSSHKey();
            this.renderGithubToken();
            this.renderPersonalTokenTable();
        },

        renderPublicSSHKey: function () {
            this.$publicSSHKey.text(this.settings.publicSSHKey);
        },

        renderGithubToken: function () {
            this.$githubToken.val(this.settings.githubToken);
            this.$saveTokenButton.attr('disabled', '');
        },

        renderPersonalTokenTable: function () {
            console.log('this.settings.personalTokens', this.settings.personalTokens);
            this.$personalTokenTable.html(this.$personalTokenTemplate(this.settings.personalTokens));
        },

        notify: function (title, message, type) {
            // type: undefined | 'info' | 'success' | 'danger'
            var duration = 3000 + (title.length + message.length) * 50;
            $.toast('<h4>' + title + '</h4> ' + message, {duration: duration , type: type});
        },
    };

    var self = SettingsController;

    return SettingsController;
});