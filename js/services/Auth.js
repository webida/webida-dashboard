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
    'webida',
], function (appConfig, webida) {
    'use strict';

    var Auth = {
        userInfo: undefined,
        
        getLoginUrl: function () {
            return webida.conf.authApiBaseUrl + '/authorize?response_type=token' +
                '&redirect_uri=' + encodeURIComponent(appConfig.redirectUrl) +
                '&client_id=' + appConfig.clientId +
                '&skip_decision=false&type=web_server&state=site';
        },
        
        logout: function () {
            return new Promise(function (resolve, reject) {
                console.log('promise logout');
                webida.auth.logout(function (err) {
                    if (err) {
                        reject(new Error('logout fail'));
                    } else {
                        //location.reload();
                        resolve();
                    }
                });
            });
        },
        
        getLoginStatusOnce: function () {
            return (this._getLoginStatus = this._getLoginStatus || this.getLoginStatus());
        },
        
        getLoginStatus: function () {
            var that = this;
            return new Promise(function (resolve, reject) {
                webida.auth.getLoginStatus(function (err, user) {
                    if (err || !user) {
                        reject(new Error('need to login'));
                    } else {
                        that.userInfo = user;
                        resolve(user);
                    }
                });
            });
        },
        
        getMyInfo: function (isForceReload) {
            var reload = !this.userInfo || isForceReload;
            if (reload) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    webida.auth.getMyInfo(function (err, user) {
                        if (err || !user) {
                            reject(new Error('fail to get myInfo'));
                        } else {
                            that.userInfo = user;
                            resolve(user);
                        }
                    });
                });
            } else {
                return Promise.resolve(this.userInfo);
            }
        },
        
        updateUser: function (user) {
            var that = this;
            return new Promise(function (resolve, reject) {
                webida.auth.updateUser(user, function (err, user) {
                    if (err || !user) {
                        reject(new Error('fail to update userInfo'));
                    } else {
                        that.userInfo = user;
                        resolve(user);
                    }
                });
            });
        },
        
        initAuthOnce: function () {
            return (this._initAuth = this._initAuth || this.initAuth());
        },
        
        initAuth: function () {
            return new Promise(function (resolve/*, reject*/) {
                console.log('promise initAuth');
                webida.auth.initAuth(appConfig.clientId, appConfig.redirectUrl,
                    null,
                    function (sessionID) {
                        resolve(sessionID);
                    });
            });
        },
        
        getPersonalTokens: function () {
            return new Promise(function (resolve, reject) {
                webida.auth.getPersonalTokens(function (e, personalTokens) {
                    if (e) {
                        reject(e);
                    } else {
                        resolve(personalTokens);
                    }
                });
            });
        },

        addNewPersonalToken: function () {
            return new Promise(function (resolve, reject) {
                webida.auth.addNewPersonalToken(function (e, token) {
                    if (e) {
                        reject(e);
                    } else {
                        resolve(token);
                    }
                });
            });
        },

        deletePersonalToken: function (token) {
            return new Promise(function (resolve, reject) {
                webida.auth.deletePersonalToken(token, function (e) {
                    if (e) {
                        reject(e);
                    } else {
                        resolve();
                    }
                });
            });
        },
        
        createAccount: function (email) {
            return new Promise(function (resolve, reject) {
                webida.auth.signup(email, function (err) {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve();
                    }
                });
            });
        },
    };

    return Auth;
});