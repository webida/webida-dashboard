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
    'notify',
    'services/Auth',
], function (appConfig, notify, Auth) {
    'use strict';
    
    var AccountController = {
        userInfo: undefined,
        
        init: function (user) {
            this.userInfo = user;
            this.cacheElements();
            this.bindEvents();
            this.renderAccount();
            this.verifyAllPasswordInputs();
        },
        
        cacheElements: function () {
            // templates
            // page widgets
            this.$openAccountButton = $('#open-account-button');
            // modal widgets
            this.$userAccountModal = $('#user-account');
            this.$accountOldPassword = this.$userAccountModal.find('#account-old-password');
            this.$accountNewPassword = this.$userAccountModal.find('#account-new-password');
            this.$accountConfirmPassword = this.$userAccountModal.find('#account-confirm-password');
            this.$passwordMessage = this.$userAccountModal.find('#account-password-message');
            this.$accountUpdatePasswordButton = this.$userAccountModal.find('#account-update-password-button');
            this.$accountDeleteEmail = this.$userAccountModal.find('#account-delete-email');
            this.$accountDeleteButton = this.$userAccountModal.find('#account-delete-button');
        },

        bindEvents: function () {
            this.$openAccountButton.on('click', function () {
                self.$userAccountModal.modal();
                return false;
            });
            
            this.$userAccountModal.on('shown.bs.modal', function () {
                //
            });
            
            this.$userAccountModal.on('hidden.bs.modal', function () {
                self.renderAccount();
                self.verifyAllPasswordInputs();
            });
            
            this.$accountUpdatePasswordButton.on('click', function () {
                var oldPassword = self.$accountOldPassword.val();
                var newPassword = self.$accountNewPassword.val();
                Auth.changeMyPassword(oldPassword, newPassword).then(function () {
                    notify.success('Password successfully changed');
                }).catch(function (err) {
                    console.log(err);
                    notify.error(err);
                });
                
                return false;
            });
            
            this.$accountOldPassword.on('keyup', function () {
                self.verifyAllPasswordInputs();
            });
            
            this.$accountNewPassword.on('keyup', function () {
                self.verifyAllPasswordInputs();
            });
            
            this.$accountConfirmPassword.on('keyup', function () {
                self.verifyAllPasswordInputs();
            });
            
            this.$accountDeleteEmail.on('input', function () {
                self.verifyAccountEmail();
            });
            
            this.$accountDeleteButton.on('click', function () {
                Auth.deleteMyAccount().then(function () {
                    notify.success('');
                    Auth.logout().then(function () {
                        location.href = '/index.html';
                    }).catch(function (e) {
                        notify.alert(e);
                    });
                }).catch(function (err) {
                    notify.error(err);
                });

                return false;
            });
        },

        verifyAllPasswordInputs: function () {
            var valid = true;
            var msg = 'Okay, now you can try to update your password.';
            if (self.$accountNewPassword.val() !== self.$accountConfirmPassword.val()) {
                msg = 'Passwords don\'t match';
                valid = false;
            }
            if (self.$accountNewPassword.val().length === 0) {
                msg = 'Enter new password';
                valid = false;
            }
            if (self.$accountOldPassword.val() === self.$accountNewPassword.val()) {
                msg = 'Enter new password differently from the old.';
                valid = false;
            }
            if (self.$accountOldPassword.val().length === 0) {
                msg = 'Enter old password';
                valid = false;
            }
            this.$passwordMessage.text(msg);
            
            if (valid) {
                self.enableUpdatePasswordButton();
            } else {
                self.disableUpdatePasswordButton();
            }
        },
        
        verifyAccountEmail: function () {
            var email = self.$accountDeleteEmail.val();
            
            if (email === self.userInfo.email) {
                self.$accountDeleteButton.removeAttr('disabled');
            } else {
                self.$accountDeleteButton.attr('disabled', '');
            }
        },
        
        enableUpdatePasswordButton: function () {
            self.$accountUpdatePasswordButton.removeAttr('disabled');
        },
        
        disableUpdatePasswordButton: function () {
            self.$accountUpdatePasswordButton.attr('disabled', '');
        },
        
        getModifiedProfile: function () {
            var profile = {};
            //$.extend(profile, this.userInfo);
            profile.email = this.userInfo.email;
            profile.name = this.$profileName.val();
            profile.url = this.$profileUrl.val();
            profile.company = this.$profilCompany.val();
            profile.location = this.$profileLocation.val();
            profile.gravatar = this.$profileGravatar.val();
            return profile;
        },
        
        setProfile: function (user) {
            this.userInfo = user || this.userInfo;
        },
        
        loadProfile: function () {
            Auth.getMyInfo(true).then(function (user) {
                self.userInfo = user;
            }).catch(function (e) {
                notify.alert('Error', e, 'danger');
                console.log(e);
            });
        },
        
        renderAccount: function (user) {
            this.userInfo = user || this.userInfo;
            this.$accountOldPassword.val('');
            this.$accountNewPassword.val('');
            this.$accountConfirmPassword.val('');
            this.$accountUpdatePasswordButton.attr('disabled', '');
            this.$accountDeleteEmail.val('');
            this.$accountDeleteButton.attr('disabled', '');
        },
        
        updateProfile: function (user) {
            return new Promise(function (resolve, reject) {
                Auth.updateUser(user).then(function (user) {
                    self.userInfo = user;
                    resolve(user);
                }).catch(function (e) {
                    console.log(e);
                    reject(e);
                });
            });
        },
    };

    var self = AccountController;

    return AccountController;
});
