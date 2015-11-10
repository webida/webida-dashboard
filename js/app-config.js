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
    'webida'
], function (
    webida
) {
    'use strict';
    var APP_ID = 'app-dashboard';
    var serverConf;

    try {
        serverConf = JSON.parse($.ajax({
            type: 'GET',
            url: webida.conf.appApiBaseUrl + '/configs',
            async: false
        }).responseText);
    } catch (e) {
        console.warn('Failed to load configs. Using default one: ' + e.message);
        serverConf = {
            systemApps: {
                'webida-client': { baseUrl: window.location.protocol + '//ide.' + window.location.host },
                'app-dashboard': { baseUrl: window.location.protocol + '//' + window.location.host }
            },
            featureEnables: { signUp: true, guestMode: false }
        };
    }

    return {
        appId: APP_ID,
        clientId: 'DASHBOARD_CLIENT_ID',
        signUpEnable: !!serverConf.featureEnables.signUp,
        guestMode: !!serverConf.featureEnables.guestMode,
        redirectUrl: serverConf.systemApps[APP_ID].baseUrl + '/pages/auth.html',
        ideBaseUrl: serverConf.systemApps['webida-client'].baseUrl
    };
});