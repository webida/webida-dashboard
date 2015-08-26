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
    'app-data',
    'webida-0.3',
    'FS',
    'lodash.min',
    'router',
], function (appConfig, appData, webida, FS, _, router) {
    'use strict';

    console.log('required');
    var userInfo = null;
    var WORKSPACE_PATH = '/';

    var promises = {
        getLoginStatusOnce: function () {
            return (this._getLoginStatus = this._getLoginStatus || this.getLoginStatus());
        },
        getLoginStatus: function () {
            return new Promise(function (resolve, reject) {
                console.log('promise getLoginStatus');
                webida.auth.getLoginStatus(function (err, user) {
                    if (err || !user) {
                        reject(new Error('need to login')); // never executed
                    } else {
                        userInfo = user;
                        console.log(user);
                        console.log('login');
                        resolve(user);
                    }
                });
            });
        },
        initAuthOnce: function () {
            return (this._initAuth = this._initAuth || this.initAuth());
        },
        initAuth: function () {
            return (promises.initAuthInstance = new Promise(function (resolve, reject) {
                console.log('promise initAuth');
                webida.auth.initAuth(appConfig.clientId, appConfig.redirectUrl, null,
                    function () {
                        resolve();
                    });
            }));
        },
        getWorkspaces: function () {
            return new Promise(function (resolve, reject) {
                console.log('promise getWorkspaces');
                FS.list(WORKSPACE_PATH, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('data', data);
                        var workspaces = _.chain(data).filter(function (file) {
                            if (!file.name.match(/^\./) && file.isDirectory) {
                                // TODO it must have '.workspace' directory
                                return true;
                            }
                        }).value();
                        workspaces.sort(function (a, b) {
                            return (a.name > b.name) ? 1 : -1;
                        });
                        resolve(workspaces);
                    }
                });
            });
        },
        getProjects: function(wsName) {
            return new Promise(function (resolve, reject) {
                console.log('promise getProjects', wsName);
                FS.list(wsName, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('data', data);
                        var projects = _.chain(data).filter(function (file) {
                            if (!file.name.match(/^\./) && file.isDirectory) {
                                // TODO it must have '.workspace' directory
                                return true;
                            }
                        }).value();
                        projects.sort(function (a, b) {
                            return (a.name > b.name) ? 1 : -1;
                        });
                        resolve(projects);
                    }
                });
            });
        },
    };

    var Deploy = new Class();
    Deploy.include({
        index: 0,
        name: '',
        type: '',
        url: '',
        init: function (obj) {
            if (typeof (obj) === 'object') {
                $.extend(this, obj);
            }
        }
    });

    var Project = new Class();
    Project.include({
        index: 0,
        name: '',
        type: '',
        deploys: [], // array of Deploy
        init: function (obj) {
            if (typeof (obj) === 'object') {
                $.extend(this, obj);
            }
        }
    });

    var Workspace = new Class();
    Workspace.include({
        index: 0,
        name: '',
        size: '',
        projects: [], // array of Workspace
        init: function (obj) {
            if (typeof (obj) === 'object') {
                $.extend(this, obj);
            }
        }
    });

    var Works = new Class();
    Works.include({
        workspaces: [], // array of Workspace
        init: function (obj) {
            if (typeof (obj) === 'object') {
                $.extend(this, obj);
            }
        },
        addWorkspace: function (ws) {
            if (this.findWorkspace(ws.name)) {
                return false;
            }
            this.workspaces.unshift(ws);
            return ws;
        },
        findWorkspace: function (name) {
            for (var i = 0; i < this.workspaces.length; ++i) {
                var ws = this.workspaces[i];
                if (ws.name === name) {
                    return ws;
                }
            }
            return undefined;
        },
        deleteWorkspace: function (name) {
            for (var i = 0; i < this.workspaces.length; ++i) {
                var ws = this.workspaces[i];
                if (ws.name === name) {
                    return this.workspaces.splice(i, 1);
                }
            }
            return undefined;
        },
    });

    var works = new Works();

    var app = {
        init: function () {
            promises.getLoginStatusOnce().catch(function () {
                location.href = 'index.html';
            }).then(function (user) {
                userInfo = user;
                app.setOnlineView();
                $("#user-email").text(user.email);
                return promises.initAuthOnce();
            }).catch(function (err) {
                console.log(err);
            });
            app.cacheElements();
            app.bindEvents();
            $.setPageContainer('#page-container');
            // for debugging
            window.app = this;
        },
        cacheElements: function () {
            console.log('cacheElements');
            // templates
            app.workspacePanelTemplate = Handlebars.compile($('#workspace-panel-template').html());
            app.workspaceItemTemplate = Handlebars.compile($('#workspace-item-template').html());
            // widgets
            app.$wrapper = $('#wrapper');
            app.$containerPage = app.$wrapper.find('#container-page');
            app.$workspacePage = app.$wrapper.find('#workspace-page');
            app.$workspacePanel = app.$wrapper.find('#workspace-panel');
            app.$settingsPage = app.$wrapper.find('#settings-page');
            app.$createWorkspaceButton = app.$wrapper.find('#create-workspace-button');
        },
        bindEvents: function () {
            app.renderWorkspaces();
            app.$workspacePage.on('page-init', function (e, hash, param) {
                /*
                promises.getLoginStatusOnce().then(function() {
                    return promises.initAuthOnce();
                }).then(function() {
                    return promises.getWorkspaces();
                }).then(function (workspaces) {
                    for (var i in workspaces) {
                        var ws = workspaces[i];
                        works.addWorkspace(new Workspace({
                            name: ws.name,
                            projects: [],
                        }));
                    }
                    app.renderWorkspaces();
                    console.log(workspaces);
                });
                */
                app.getWorkspaces();
                console.log('page init', app);
            });
            app.$workspacePage.on('page-on', function (e, hash, param) {
                console.log('page on', app, param);
                if (param === "new") {
                    var wsName = 'new workspace';
                    var wsNewName = wsName;
                    var isConflict = function (name) {
                        for (var i in works.workspaces) {
                            if (name === works.workspaces[i].name) {
                                return true;
                            }
                        }
                        return false;
                    };
                    for (var count = 1; isConflict(wsNewName); ++count) {
                        wsNewName = wsName + ' (' + count + ')';
                    }
                    app.$newWorkspace.removeClass('webida-hidden');
                    app.$newWorkspaceName.val(wsNewName).focus().select();
                } else {
                    app.$newWorkspace.addClass('webida-hidden');
                }
            });
            app.$createWorkspaceButton.on('click', function () {
                console.log('click');
                $.changePage('#workspace', 'new');
                return false;
            });
            app.$workspacePanel.delegate('#create-decision-button', 'click', function (e) {
                var wsName = app.$newWorkspaceName.val();
                app.createWorkspace.call(app, wsName);
                return false;
            });
            app.$workspacePanel.delegate('#new-workspace-name', 'keypress', function (e) {
                //console.log('keypress', e);
                if (e.charCode === 13) { // Enter
                    var wsName = app.$newWorkspaceName.val();
                    var ws = app.createWorkspace.call(app, wsName);
                }
            });
            app.$workspacePanel.delegate('#delete-workspace-button', 'click', function (e) {
                var wsName = $(this).attr('data-key');
                console.log('delete', wsName);
                var ws = app.deleteWorkspace(wsName);
                if (!ws) {
                    // Todo: ws deletion fail
                }
                return false;
            });

            app.$workspacePanel.delegate('#new-workspace-name', 'keydown', function (e) {
                //console.log('keydown', e);
                if (e.keyCode === 27) { // Esc
                    $.changePage('#workspace');
                }
            });
        },
        render: function () {

        },
        renderWorkspaces: function () {
            app.$workspacePanel.html(app.workspacePanelTemplate(works.workspaces));
            app.$newWorkspace = $('#new-workspace');
            app.$newWorkspaceName = app.$newWorkspace.find('#new-workspace-name');
        },
        createWorkspace: function (name) {
            console.log('createWorkspace this', this);
            var ws = new Workspace({
                'name': name,
                'size': '0MB',
            });
            works.addWorkspace(ws);
            app.renderWorkspaces();
            $.changePage('#workspace-page');
            return ws;
        },
        deleteWorkspace: function (name) {
            console.log('deleteWorkspace this', this);
            var ws = works.deleteWorkspace(name);
            if (ws) {
                app.renderWorkspaces();
            }
            return ws;
        },
        setOnlineView: function () {
            $('#account-menu').removeClass('webida-hidden');
            $('#create-workspace-button').removeClass('webida-hidden');
            $('#refresh-workspace-button').removeClass('webida-hidden');
        },
        renderWorkspace: function(ws) {
            $('div.workspace-item[data-key="' + ws.name + '"]').html(app.workspaceItemTemplate(ws));
        },
        getWorkspaces: function() {
            promises.getLoginStatusOnce().then(function() {
                return promises.initAuthOnce();
            }).then(function() {
                return promises.getWorkspaces();
            }).then(function (workspaces) {
                for (var i in workspaces) {
                    var ws = workspaces[i];
                    works.addWorkspace(new Workspace({
                        name: ws.name,
                        projects: [],
                    }));
                    promises.getProjects(ws.name).then(function(wsName) {
                        return function(projects) {
                            console.log('getProject', wsName);
                            var ws = works.findWorkspace(wsName);
                            ws.projects = projects;
                            app.renderWorkspace(ws);
                        };
                    }(ws.name));
                }
                app.renderWorkspaces();
                console.log(workspaces);
            });
        },
    };

    $(function () {
        console.log('onload');
        app.init();
    });
});