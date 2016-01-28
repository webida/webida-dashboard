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
    'ModalFactory',
    'notify',
    'services/Auth',
    'services/SettingsManager',
], function (appConfig, ModalFactory, notify, Auth, SettingsManager) {
    'use strict';

    var SettingsController = {
        settings: {
            publicSSHKey: undefined,
            githubToken: undefined,
            personalTokens: []
        },

        init: function () {
            this.cacheElements();
            this.bindEvents();
            this.loadSettings().then(function () {
                self.renderSettings();
            });
        },

        cacheElements: function () {
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
            /* jshint newcap: false */
            this.generateNewKeyModal = ModalFactory('#common-modal', '#common-modal-template');
            /* jshint newcap: true */

        },

        bindEvents: function () {
            this.$settingsPage.on('page-on', function (e, hash, param) {
                console.log('page on', hash, param);
            });

            this.generateNewKeyModal.setup({
                title: 'Generate New Key',
                message: 'The previous public ssh key will be replaced with a new one! Are you sure to continue?',
                buttons: [{
                    id: 'generate-yes-button',
                    name: 'Yes',
                    class: 'btn btn-danger',
                    onclick: function () {
                        self.generatePublicSSHKey();
                    }
                }, {
                    name: 'No',
                    default: true,
                    close: true,
                }]
            });

            this.$generateNewKeyButton.on('click', function () {
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

            this.$githubToken.on('input', function () {
                if (self.$githubToken.val() === self.settings.githubToken) {
                    self.$saveTokenButton.attr('disabled', '');
                } else {
                    self.$saveTokenButton.removeAttr('disabled');
                }
            });

            this.$saveTokenButton.on('click', function () {
                self.saveGithubToken();
            });

            this.$addNewPersonalTokenButton.on('click', function () {
                SettingsManager.addNewPersonalToken().then(function () {
                    return SettingsManager.getPersonalTokens();
                }).then(function (tokens) {
                    console.log('tokens', tokens);
                    self.settings.personalTokens = tokens;
                    self.renderPersonalTokenTable();
                }).catch(function (e) {
                    notify.alert('Error', e, 'danger');
                });
            });

            this.$personalTokenTable.delegate('a.delete-token', 'click', function () {
                var token = $(this).attr('data-token');
                SettingsManager.deletePersonalToken(token).then(function () {
                    return self.loadPersonalTokens();
                }).then(function () {
                    self.renderPersonalTokenTable();
                }).catch(function (e) {
                    notify.alert('Error', e, 'danger');
                });
            });
        },

        loadSettings: function () {
            return Promise.all([self.loadPublicSSHKey(),
                self.loadGitHubToken(),
                self.loadPersonalTokens()
            ]).catch(function (e) {
                notify.alert('Error', e, 'danger');
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

        generatePublicSSHKey: function () {
            var buttonObj = $('#' + this.id);
            console.log('Yes');
            buttonObj.attr('disabled', '');
            SettingsManager.removePublicSSHKey().catch(function () {
            }).then(function () {
                return SettingsManager.generatePublicSSHKey();
            }).then(function () {
                return SettingsManager.getPublicSSHKey();
            }).then(function (key) {
                console.log('key', key);
                self.settings.publicSSHKey = key;
                self.renderPublicSSHKey();
                notify.alert('Info', 'New public SSH key generated successfully');
            }).catch(function (e) {
                notify.alert('Error', e, 'danger');
            }).then(function () {
                buttonObj.removeAttr('disabled');
                self.generateNewKeyModal.close();
            });
        },

        saveGithubToken: function () {
            self.$saveTokenButton.removeAttr('disabled');
            var token = self.$githubToken.val();

            SettingsManager.setGitHubToken(token).then(function () {
                return SettingsManager.getGitHubToken();
            }).then(function (token) {
                self.settings.githubToken = token;
                self.renderGithubToken();
                notify.alert('Info', 'GitHub token saved successfully');
            }).catch(function (e) {
                notify.alert('Error', e, 'danger');
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
    };

    var self = SettingsController;

    return SettingsController;
});
