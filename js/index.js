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

$(function () {
    'use strict';
    
    require([
        'app-config',
        'webida-0.3'
    ], function (appConfig, webida) {
        
        webida.auth.initAuth(appConfig.clientId, appConfig.redirectUrl);

        webida.auth.getLoginStatus(function (err, user) {
            if (err || !user) {
                //$('button.login').removeClass('webida-hidden');
                //$('button.logout').addClass('webida-hidden');
            } else {
                //$('button.login').addClass('webida-hidden');
                //$('button.logout').removeClass('webida-hidden');
                location.href = 'main.html';
            }
        });

        $('button.login').click(function () {
            //var reUrl = getRedirectUrl();
            var url = webida.conf.authApiBaseUrl + '/authorize?response_type=token' +
                '&redirect_uri=' + encodeURIComponent(appConfig.redirectUrl) +
                '&client_id=' + appConfig.clientId +
                '&skip_decision=false&type=web_server&state=site';

            location.href = url;
        });

        $('button.logout').click(function () {
            webida.auth.logout(function (err) {
                if (err) {
                    console.log('login fail', err);
                } else {
                    location.reload();
                }
            });
        });
    });

    function setOnlineView() {

    }

    function setOfflineView() {

    }

});