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
    'services/FS',
    'services/App',
    'lodash.min',
], function (appConfig, FS, App, _) {
    'use strict';

    var WorkspaceManager = function () {

    };

    var WORKSPACE_PATH = '/';
    var fsid;

    $.extend(WorkspaceManager.prototype, {
        getWorkspaces: function () {
            return new Promise(function (resolve, reject) {
                console.log('promise getWorkspaces');
                FS.list(WORKSPACE_PATH, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        //console.log('data', data);
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

        getProjects: function (wsName) {
            return new Promise(function (resolve, reject) {
                //console.log('promise getProjects', wsName);
                FS.list(wsName, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        //console.log('data', data);
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

        loadWorkspaces: function (workspacesCallback, projectsCallback) {
            var _this = this;
            Promise.all([this.getWorkspaces(), App.getMyAppInfo()]).then(function (values) {
                var workspaces = values[0];
                var apps = values[1];
                console.log('workspaces', workspaces);
                //console.log('apps', apps);

                function findApp(wsName, prjName) {
                    for (var i in apps) {
                        var app = apps[i];
                        if (app.url.workspace === wsName && app.url.project == prjName) {
                            return app;
                        }
                    }
                    return undefined;
                }

                workspacesCallback(workspaces);
                workspaces.forEach(function (workspace) {
                    console.log('workspace', workspace);
                    _this.getProjects(workspace.name).then(function (workspace) {
                        return function (projects) {
                            //console.log('getProjects', workspace.name);
                            workspace.projects = projects;
                            workspace.projects.forEach(function (proj) {
                                //console.log('project', proj);
                                proj.deploys = [];
                                var app = findApp(workspace.name,
                                    proj.name);
                                if (app) {
                                    proj.deploys.push({
                                        name: app.name,
                                        url: App.getDeployedAppUrl(
                                            app.domain
                                        ),
                                    });
                                }
                            }); // foreach ws.projects
                            projectsCallback(workspace);
                        };
                    }(workspace));
                }); // foreach workspaces
            });
        },

        getWorkspaceOpenUrl: function (wsName) {
            return 'https://webida.org/apps/ide/src/index.html?workspace=' + fsid + '/' + wsName;
        },

        createWorkspace: function (name /*, desc*/ ) {
            // TODO should save desc when createWorkspace. Later, use desc parameter.
            var WS_META_PATH = name + '/.workspace';
            var WS_META_FILE = WS_META_PATH + '/workspace.json';
            console.log('createWorkspace', name);

            return new Promise(function (resolve, reject) {
                FS.createDirectory(name, false).then(function () {
                    FS.createDirectory(WS_META_PATH)
                        .then($.proxy(FS.writeFile, FS, WS_META_FILE, ''))
                        .then(function () {
                            resolve();
                        })
                        .fail(function (e) {
                            FS.delete(name, true);
                            reject(e);
                        });
                }).fail(function (e) {
                    reject(e);
                });
            });
        },

        deleteWorkspace: function (name) {
            return new Promise(function (resolve, reject) {
                FS.delete(name, true).then(function () {
                    resolve();
                }).fail(function () {
                    reject(new Error('fail to remove workspace ' + name));
                });
            });
        },

        editWorkspace: function (oldName, newName) {
            // TODO should make the way to save description or some other workspace's information.
            return new Promise(function (resolve, reject) {
                FS.rename(oldName, newName).then(function () {
                    resolve();
                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        getQuota: function () {
            return new Promise(function (resolve, reject) {
                Promise.all([FS.getQuotaLimit(), FS.getQuotaUsage()]).then(function (values) {
                    var quota = {
                        limit: values[0],
                        usage: values[1]
                    };
                    resolve(quota);
                }).catch(function (e) {
                    reject(e);
                });
            });
        },
    });

    if (WorkspaceManager.instance === undefined) {
        WorkspaceManager.instance = new WorkspaceManager();

        FS.getFSId().then(function (id) {
            fsid = id;
        }).fail(function (e) {
            console.log(e);
        });
    }

    return WorkspaceManager.instance;
});