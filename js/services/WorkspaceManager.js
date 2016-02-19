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
    'lodash',
    'services/App',
    'services/FS'
], function (appConfig, _, App, FS) {
    'use strict';

    var WorkspaceManager = function () {

    };

    var WORKSPACE_PATH = '/';
    var fsid;
    var WORKSPACE_DIR = '.workspace';

    $.extend(WorkspaceManager.prototype, {

        loadWorkspaces: function (callback) {
            var workspaces = [];
            function _isWorkspace(item) {
                return (!item.name.match(/^\./) && item.children &&
                    _.findIndex(item.children, {name: WORKSPACE_DIR}) > -1);
            }
            function _isProject(item) {
                return (!item.name.match(/^\./) && item.children &&
                _.findIndex(item.children, {name: '.project'}) > -1);
            }
            function _traverse(tree, type, listToPush) {
                var checkType = (type === 'workspace') ? _isWorkspace : _isProject;
                _.forEach(tree, function (item) {
                    if (checkType(item)) {
                        listToPush.push(item);
                        if(type === 'workspace' && item.children) {
                            if (!item.projects) {
                                item.projects = [];
                            }
                            _traverse(item.children, 'project', item.projects);
                        }
                    }
                });
            }
            FS.list(WORKSPACE_PATH, {
                recursive: true, maxDepth: 3, dirOnly: true
            }).then(function (dirTree) {
                if (dirTree && dirTree.length > 0) {
                    _traverse(dirTree, 'workspace', workspaces);
                }
                callback(workspaces);
            }).catch(function (e) {
                console.error(e);
            });
        },

        getWorkspaceOpenUrl: function (wsName) {
            return appConfig.ideBaseUrl + '/apps/ide/src/index.html?workspace=' + fsid + '/' + wsName;
        },

        createWorkspace: function (name /*, desc*/ ) {
            // TODO should save desc when createWorkspace. Later, use desc parameter.
            var WS_META_PATH = name + '/' + WORKSPACE_DIR; 
            var WS_META_FILE = WS_META_PATH + '/workspace.json';
            console.log('createWorkspace', name);

            return new Promise(function (resolve, reject) {
                FS.createDirectory(name, false).then(function () {
                    FS.createDirectory(WS_META_PATH)
                        .then($.proxy(FS.writeFile, FS, WS_META_FILE, ''))
                        .then(function () {
                            resolve();
                        })
                        .catch(function (e) {
                            FS.delete(name, true);
                            reject(e);
                        });
                }).catch(function (e) {
                    reject(e);
                });
            });
        },

        deleteWorkspace: function (name) {
            return new Promise(function (resolve, reject) {
                FS.delete(name, true).then(function () {
                    resolve();
                }).catch(function () {
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
        }).catch(function (e) {
            console.log(e);
        });
    }

    return WorkspaceManager.instance;
});
