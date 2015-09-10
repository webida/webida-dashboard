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
    'webida-0.3',
], function (webida) {
    'use strict';
    var App = function () {};

    $.extend(App.prototype, {
        getMyAppInfo: function () {
            return new Promise(function (resolve, reject) {
                webida.app.getMyAppInfo(function (e, info) {
                    if (e) {
                        //e = JSON.parse(e);
                        reject(e);
                    } else {
                        info.forEach(function (e, i, a) {
                            var fsUrl = a[i].srcurl;
                            if (fsUrl) {
                                var splittedUrl = fsUrl.split('/');
                                a[i].url = {
                                    protocol: splittedUrl[0],
                                    host: splittedUrl[2],
                                    fsid: splittedUrl[3],
                                    workspace: splittedUrl[4],
                                    project: splittedUrl[5],
                                };
                            } else {
                                a[i].url = {
                                    protocol: '',
                                    host: '',
                                    fsid: '',
                                    workspace: '',
                                    project: '',
                                };
                            }
                        });
                        resolve(info);
                    }
                });
            });
        },
        getHost: function () {
            return webida.app.getHost();
        },
        launchApp: function (domain, mode, queryString, newWindowOption) {
            webida.app.launchApp(domain, mode, queryString, newWindowOption);
        },
        deleteApp: function (appID) {
            return new Promise(function (resolve, reject) {
                webida.app.deleteApp(appID, function (e) {
                    if (e) {
                        //e = JSON.parse(e);
                        reject(e);
                    } else {
                        resolve();
                    }
                });
            });
        },
        getDeployedAppUrl: function (domain) {
            return webida.app.getDeployedAppUrl(domain);
        }
    });

    if (App.instance === undefined) {
        App.instance = new App();
    }

    return App.instance;
});