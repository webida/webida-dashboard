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
    'lodash',
    'q',
    'services/FS',
    'services/Auth',
], function (_, Q, FS, Auth) {
    'use strict';
    var PUBLIC_KEY_PATH = '.userinfo/id_rsa.pub';
    var RSA_KEY_PATH = '.userinfo/id_rsa';
    var GITHUB_TOKEN_PATH = '.userinfo/github.json';

    var SettingsManager = function () {

    };

    $.extend(SettingsManager.prototype, {

        getPublicSSHKey: function () {
            return new Promise(function (resolve, reject) {
                FS.exists(PUBLIC_KEY_PATH).then(function () {
                    return FS.readFile(PUBLIC_KEY_PATH)
                    .then(function (key) {
                        resolve(key);
                    }).fail(function (e) {
                        console.log('readFile error: ' + e);
                        reject(e);
                    });
                }, function () {
                    console.log('\'' + PUBLIC_KEY_PATH + '\' does not exist.');
                    resolve();
                });
            });
        },

        generatePublicSSHKey: function () {
            return new Promise(function (resolve, reject) {
                Auth.getMyInfo().then(function (info) {
                    var opts = {
                        cmd: 'ssh-keygen',
                        args: ['-t', 'rsa', '-C', info.email, '-f',
                            RSA_KEY_PATH, '-N', ''
                        ]
                    };

                    FS.exec('', opts).then(function () {
                        resolve();
                    });

                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        removePublicSSHKey: function () {
            return new Promise(function (resolve, reject) {
                FS.delete(PUBLIC_KEY_PATH, false)
                    .then($.proxy(FS.delete, FS, RSA_KEY_PATH, false))
                    .then(function () {
                        resolve();
                    }).fail(function (e) {
                        reject(e);
                    });
            });
        },

        getGitHubToken: function () {
            return new Promise(function (resolve, reject) {
                FS.exists(GITHUB_TOKEN_PATH)
                .then(function () {
                    return FS.readFile(GITHUB_TOKEN_PATH)
                    .then(function (token) {
                        resolve(JSON.parse(token).tokenKey);
                    }).fail(function (e) {
                        console.log('readFile error: ' + e);
                        reject(e);
                    });
                }, function () {
                    console.log('\'' + GITHUB_TOKEN_PATH + '\' does not exist.');
                    resolve();
                });
            });
        },

        setGitHubToken: function (token) {
            return new Promise(function (resolve, reject) {
                var obj = {
                    tokenKey: token
                };

                FS.writeFile(GITHUB_TOKEN_PATH, JSON.stringify(obj)).then(function () {
                    resolve();

                }).fail(function (e) {
                    console.log('writeFile error: ' + e);
                    reject(e);
                });
            });
        },

        getPersonalTokens: function () {
            return new Promise(function (resolve, reject) {
                Auth.getPersonalTokens().then(function (personalTokens) {
                    var tokens = _.sortBy(personalTokens, function (token) {
                        return new Date(token.issueTime).getTime();
                    });
                    resolve(tokens);
                }).catch(function (e) {
                    console.error('getPerosonalTokens error: ' + e);
                    reject(e);
                });
            });
        },

        addNewPersonalToken: function () {
            return new Promise(function (resolve, reject) {
                Auth.addNewPersonalToken().then(function (token) {
                    resolve(token);
                }).catch(function (e) {
                    console.error('addNewPersonalToken error: ' + e);
                    reject(e);
                });
            });
        },

        deletePersonalToken: function (token) {
            return new Promise(function (resolve, reject) {
                Auth.deletePersonalToken(token).then(function () {
                    resolve();
                }).catch(function (e) {
                    console.error('deletePersonalToken error: ' + e);
                    reject(e);
                });
            });
        }
    });

    if (SettingsManager.instance === undefined) {
        SettingsManager.instance = new SettingsManager();
    }

    return SettingsManager.instance;
});