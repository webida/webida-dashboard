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
    'services/AuthManager',
], function (appConfig, AuthManager) {
    'use strict';

    var ProfileController = {
        userInfo: undefined,
        init: function (user) {
            this.userInfo = user;
            this.cacheElement();
            this.eventBinding();
            this.renderProfile();
        },
        cacheElement: function () {
            // templates
            // page widgets
            // modal widgets
            this.$userProfileModal = $('#user-profile');
            this.$applyButton = this.$userProfileModal.find('button.apply');
            this.$profileEmail = this.$userProfileModal.find('#profile-email');
            this.$profileName = this.$userProfileModal.find('#profile-name');
            this.$profileUrl = this.$userProfileModal.find('#profile-url');
            this.$profilCompany = this.$userProfileModal.find('#profile-company');
            this.$profileLocation = this.$userProfileModal.find('#profile-location');
            this.$profileGravatar = this.$userProfileModal.find('#profile-gravatar');
        },
        eventBinding: function () {
            this.$userProfileModal.on('shown.bs.modal', function () {
                //
            });
            this.$userProfileModal.on('hidden.bs.modal', function () {
                self.renderProfile();
            });
            this.$applyButton.on('click', function (e) {
                self.updateProfile(self.getModifiedProfile()).then(function(user) {
                    self.renderProfile(user);
                    self.$userProfileModal.closeModal();
                }).catch(function(e) {
                    self.$applyButton.removeAttr('disabled');
                    alert(e);
                    console.log(e);
                });
                self.$applyButton.attr('disabled', '');
            });
            this.$userProfileModal.find('input.form-control').on('keypress', function (e) {
                console.log('keypress', e);
                if (e.keyCode === 13) { // Enter
                    self.$applyButton.click();
                } else {
                    self.$applyButton.removeAttr('disabled');
                }
            });
        },
        getModifiedProfile: function() {
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
            AuthManager.getMyInfo(true).then(function (user) {
                self.userInfo = user;
            }).catch(function (e) {
                alert(e);
                console.log(e);
            });
        },
        renderProfile: function (user) {
            this.userInfo = user || this.userInfo;
            this.$profileEmail.text(this.userInfo.email);
            this.$profileName.val(this.userInfo.name);
            this.$profileUrl.val(this.userInfo.url);
            this.$profilCompany.val(this.userInfo.company);
            this.$profileLocation.val(this.userInfo.location);
            this.$profileGravatar.val(this.userInfo.gravatar);
            this.$applyButton.attr('disabled', '');
        },
        updateProfile: function (user, callback) {
            return new Promise(function (resolve, reject) {
                AuthManager.updateUser(user).then(function (user) {
                    self.userInfo = user;
                    resolve(user);
                }).catch(function (e) {
                    console.log(e);
                    reject(e);
                });
            });
        },
    };

    var self = ProfileController;

    return ProfileController;
});