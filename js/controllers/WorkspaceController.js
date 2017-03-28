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

/* global Class */

define([
    'app-config',
    'lodash',
    'notify',
    'services/Auth',
    'services/WorkspaceManager',
], function (appConfig, _, notify, Auth, WorkspaceManager) {
    'use strict';

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
            this.deploys = [];
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
            this.projects = [];
        }
    });

    var Works = new Class();
    Works.include({
        status: {
            workspaceCount: 0,
            projectCount: 0,
            deployCount: 0,
            quotaUsage: 0,
            quotaLimit: 0,
        },
        workspaces: [], // array of Workspace
        init: function (obj) {
            if (typeof (obj) === 'object') {
                $.extend(this, obj);
            }
            this.workspaces = [];
        },
        fillWorkspaces: function (wss) {
            wss.forEach(function (ws) {
                var newWorkspace = new Workspace();
                newWorkspace.fillFrom(ws);
                this.workspaces.push(newWorkspace);
            }, this);
        },
        addWorkspace: function (ws) {
            if (this.findWorkspace(ws.name)) {
                return false;
            }
            this.workspaces.unshift(ws);
            return ws;
        },
        findWorkspace: function (name) {
            for (var i in this.workspaces) {
                if (this.workspaces.hasOwnProperty(i)) {
                    var ws = this.workspaces[i];
                    if (ws.name === name) {
                        return ws;
                    }
                }
            }
            return undefined;
        },
        deleteWorkspace: function (name) {
            for (var i in this.workspaces) {
                if (this.workspaces.hasOwnProperty(i)) {
                    var ws = this.workspaces[i];
                    if (ws.name === name) {
                        return this.workspaces.splice(i, 1)[0];
                    }
                }
            }
            return undefined;
        },
    });

    var WorkspaceController = {
        works: undefined,

        init: function () {
            this.works = new Works();
            this.cacheElements();
            this.bindEvents();
            this.loadWorkspaces();
        },

        cacheElements: function () {
            // templates
            this.$workspacePanelTemplate = Handlebars.compile($('#workspace-panel-template').html());
            this.$workspaceItemTemplate = Handlebars.compile($('#workspace-item-template').html());
            // page widgets
            this.$wrapper = $('#wrapper');
            this.$workspacePage = this.$wrapper.find('#workspaces-page');
            this.$workspacePanel = this.$wrapper.find('#workspace-panel');
            this.$newWorkspaceButton = this.$wrapper.find('#new-workspace-button');
            this.$refreshWorkspaceButton = this.$wrapper.find('#refresh-workspace-button');

            this.$workspaceStatus = this.$wrapper.find('#workspace-status');
            this.$workspaceUsage = this.$wrapper.find('#workspace-usage');
            this.$projectUsage = this.$wrapper.find('#project-usage');
            this.$deployUsage = this.$wrapper.find('#deploy-usage');
            this.$quotaUsage = this.$wrapper.find('#quota-usage');
            // modal widgets
            this.$newWorkspaceModal = this.$wrapper.find('#new-workspace');
            this.$newWorkspaceName = this.$newWorkspaceModal.find('#new-workspace-name');
            this.$createWorkspaceButton = this.$newWorkspaceModal.find('button.create');
            this.$newWorkspaceMesssage = this.$newWorkspaceModal.find('#new-workspace-message');

            this.$workspaceDeleteConfirmModal = this.$wrapper.find('#workspace-delete-confirm');
            this.$deleteConfirmLabel = this.$workspaceDeleteConfirmModal.find('#delete-confirm-label');
            this.$deleteConfirmText = this.$workspaceDeleteConfirmModal.find('#delete-confirm-text');
            this.$deleteWorkspaceConfirmButton = this.$workspaceDeleteConfirmModal.find('button.delete');

            this.$editWorkspaceModal = this.$wrapper.find('#edit-workspace');
            this.$editWorkspaceLabel = this.$editWorkspaceModal.find('#edit-workspace-label');
            this.$editWorkspaceName = this.$editWorkspaceModal.find('#edit-workspace-name');
            this.$applyWorkspaceButton = this.$editWorkspaceModal.find('button.apply');
        },

        bindEvents: function () {
            this.$workspacePage.on('page-on', function (e, hash, param) {
                console.log('page on', hash, param);
            });
            this.$newWorkspaceButton.on('click', function () {
                //console.log('click');
                self.popupNewWorkspace();
                return false;
            });
            this.$refreshWorkspaceButton.on('click', function () {
                self.loadWorkspaces();
            });

            // $newWorkspaceModal
            this.$newWorkspaceModal.on('shown.bs.modal', function () {
                self.$newWorkspaceName.focus().select();
            });
            this.$newWorkspaceModal.on('hidden.bs.modal', function () {
                self.$createWorkspaceButton.prop('disabled', false);
                self.$newWorkspaceMesssage.text('');
            });
            this.$newWorkspaceName.on('input', function (evt) {
                var wsName = evt.target.value.trim();
                var msg = '';
                if (_.isEmpty(wsName)) {
                    self.$createWorkspaceButton.prop('disabled', true);
                } else if (self.checkWorkspace(wsName)) {
                    msg = 'The workspace name already exist.';
                    self.$createWorkspaceButton.prop('disabled', true);
                } else {
                    self.$createWorkspaceButton.prop('disabled', false);
                    if (evt.keyCode === 13) { // Enter
                        self.$createWorkspaceButton.click();
                    }
                }
                self.$newWorkspaceMesssage.text(msg);
            });
            this.$createWorkspaceButton.on('click', function () {
                var wsName = self.$newWorkspaceName.val().trim();
                self.createWorkspace(wsName, function () {
                    self.$newWorkspaceModal.closeModal();
                });
                return false;
            });

            // $workspaceDeleteConfirmModal
            this.$workspaceDeleteConfirmModal.on('shown.bs.modal', function () {
                self.$deleteConfirmText.focus().select();
            });
            this.$workspaceDeleteConfirmModal.on('hidden.bs.modal', function () {
                self.$deleteWorkspaceConfirmButton.prop('disabled', true);
            });
            this.$workspacePanel.delegate('#delete-workspace-button', 'click', function () {
                var wsName = $(this).attr('data-workspace');
                console.log('delete modal', wsName, this);
                self.$workspaceDeleteConfirmModal.find('button.delete').attr('data-workspace', wsName);
                self.$deleteConfirmLabel.text('Workspace name ("' + wsName + '")');
                self.$deleteConfirmText.val('');
                self.$workspaceDeleteConfirmModal.modal();
                return false;
            });
            this.$deleteConfirmText.on('input', function (evt) {
                var wsName = self.$deleteWorkspaceConfirmButton.attr('data-workspace');
                var inputName = evt.target.value.trim();
                if (inputName === wsName) {
                    self.$deleteWorkspaceConfirmButton.prop('disabled', false);
                    if (evt.keyCode === 13) { // Enter
                        self.$deleteWorkspaceConfirmButton.click();
                    }
                } else {
                    self.$deleteWorkspaceConfirmButton.prop('disabled', true);
                }
            });
            this.$deleteWorkspaceConfirmButton.on('click', function () {
                var wsName = $(this).attr('data-workspace');
                console.log('delete', this);
                self.deleteWorkspace(wsName, function (e) {
                    if (e) {
                        console.log(e);
                        notify.alert('error', e, 'danger');
                    }
                    self.$workspaceDeleteConfirmModal.closeModal();
                    self.$deleteConfirmText.val('');
                });
                return false;
            });

            // $editWorkspaceModal
            this.$editWorkspaceModal.on('shown.bs.modal', function () {
                self.$editWorkspaceName.focus().select();
            });
            this.$editWorkspaceModal.on('hidden.bs.modal', function () {
                self.$applyWorkspaceButton.prop('disabled', false);
            });
            this.$workspacePanel.delegate('#edit-workspace-button', 'click', function () {
                var wsName = $(this).attr('data-workspace');
                console.log('delete modal', wsName, this);
                self.$editWorkspaceModal.find('button.apply').attr('data-workspace', wsName);
                self.$editWorkspaceName.val(wsName);
                self.$editWorkspaceModal.modal();
            });
            this.$editWorkspaceName.on('input', function (evt) {
                var wsName = evt.target.value.trim();
                if (_.isEmpty(wsName) || self.checkWorkspace(wsName)) {
                    self.$applyWorkspaceButton.prop('disabled', true);
                } else {
                    self.$applyWorkspaceButton.prop('disabled', false);
                    if (evt.keyCode === 13) { // Enter
                        self.$applyWorkspaceButton.click();
                    }
                }
            });
            this.$applyWorkspaceButton.on('click', function () {
                var oldName = self.$applyWorkspaceButton.attr('data-workspace');
                var newName = self.$editWorkspaceName.val().trim();
                self.editWorkspace(oldName, newName, function (e) {
                    if (e) {
                        console.log(e);
                        notify.alert('error', e, 'danger');
                    }
                    self.$editWorkspaceModal.closeModal();
                });
            });

            this.$workspacePanel.delegate('.workspace-open', 'click', function () {
                console.log('open');
                var wsName = $(this).attr('data-workspace');
                window.open(WorkspaceManager.getWorkspaceOpenUrl(wsName));
            });
        },

        renderWorkspace: function (workspace) {
            $('div.workspace-item[data-workspace="' + workspace.name + '"]').html(self.$workspaceItemTemplate(
                workspace));
        },

        renderWorkspaces: function (workspaces) {
            workspaces = workspaces || self.works.workspaces;
            workspaces = _.sortByOrder(workspaces, ['name']);
            self.$workspacePanel.html(self.$workspacePanelTemplate(workspaces));
        },

        renderStatus: function () {
            this.$workspaceStatus.removeClass('webida-hidden');
            this.works.status.workspaceCount = this.works.workspaces.length;
            this.$workspaceUsage.text(this.works.status.workspaceCount);
            this.$projectUsage.text(this.works.status.projectCount);
            this.$deployUsage.text(this.works.status.deployCount);

            var usageMB = parseInt(this.works.status.quotaUsage / (1024 * 1024), 10);
            var limitMB = parseInt(this.works.status.quotaLimit / (1024 * 1024), 10);
            var percent = parseInt(+this.works.status.quotaUsage / +this.works.status.quotaLimit * 100,
                                   10);

            this.$quotaUsage.text(usageMB + 'MB /' + limitMB + 'MB(' + percent + '%)');
        },

        loadQuata: function () {
            WorkspaceManager.getQuota().then(function (quota) {
                self.works.status.quotaUsage = quota.usage;
                self.works.status.quotaLimit = quota.limit;
                self.renderStatus();
            }).catch(function (e) {
                // TODO: fix server's quota handle logic(`fs/lib/linuxfs/default.js`)
                //notify.alert('error', e, 'danger');
                console.log(e);
            });
        },

        loadWorkspaces: function () {
            function _renderProjects(workspace) {
                console.log('self.works.findWorkspace', workspace);
                self.works.findWorkspace(workspace.name).fillFrom(workspace);
                self.renderWorkspace(workspace);
                self.works.status.projectCount += (workspace.projects ? workspace.projects.length : 0);
                workspace.projects.forEach(function (project) {
                    self.works.status.deployCount += (project.deploys ?
                                                      project.deploys.length : 0);
                });
            }
            function _renderWorkspaces(workspaces) {
                self.works = new Works();
                self.works.fillWorkspaces(workspaces);
                self.renderWorkspaces();
                self.setOnlineView();
                self.loadQuata();
                self.works.status.workspaceCount = workspaces.length;
                self.works.status.projectCount = 0;
                self.works.status.deployCount = 0;
                _.forEach(workspaces, _renderProjects);
                self.renderStatus();
            }
            WorkspaceManager.loadWorkspaces(_renderWorkspaces);
        },

        popupNewWorkspace: function () {
            var wsName = 'new workspace';
            var wsNewName = wsName;
            var isConflict = function (name) {
                for (var i in self.works.workspaces) {
                    if (name === self.works.workspaces[i].name) {
                        return true;
                    }
                }
                return false;
            };
            for (var count = 1; isConflict(wsNewName); ++count) {
                wsNewName = wsName + ' (' + count + ')';
            }
            console.log(self.$newWorkspaceModal.modal);
            self.$newWorkspaceModal.modal();
            self.$newWorkspaceName.val(wsNewName);
        },

        createWorkspace: function (name, callback) {
            console.log('createWorkspace', name);
            WorkspaceManager.createWorkspace(name).then(function () {
                var ws = new Workspace({
                    'name': name,
                    'size': '0MB',
                });
                self.works.addWorkspace(ws);
                self.renderWorkspaces();
                self.renderStatus();
                if (callback) {
                    callback();
                }
            }).catch(function (e) {
                notify.alert('error', e, 'danger');
                console.log('createWorkspace error', e);
                if (callback) {
                    callback(e);
                }
            });
        },

        deleteWorkspace: function (name, callback) {
            console.log('deleteWorkspace this', this);
            WorkspaceManager.deleteWorkspace(name).then(function () {
                var ws = self.works.deleteWorkspace(name);
                if (ws) {
                    self.renderWorkspaces();
                    self.works.status.projectCount -= ws.projects.length;
                    self.renderStatus();
                }
                if (callback) {
                    callback();
                }
            }).catch(function (e) {
                notify.alert('error', e, 'danger');
                if (callback) {
                    callback(e);
                }
            });
        },

        editWorkspace: function (oldName, newName, callback) {
            console.log('editWorkspace', name, newName);
            WorkspaceManager.editWorkspace(oldName, newName).then(function () {
                var ws = self.works.findWorkspace(oldName);
                ws.name = newName;
                self.renderWorkspaces();
                if (callback) {
                    callback();
                }
            }).catch(function (e) {
                notify.alert('error', e, 'danger');
                if (callback) {
                    callback(e);
                }
            });
        },

        setOnlineView: function () {
            self.$newWorkspaceButton.removeClass('webida-hidden');
            self.$refreshWorkspaceButton.removeClass('webida-hidden');
        },

        checkWorkspace: function (wsName) {
            return _.some(self.works.workspaces, {'name': wsName});
        }
    };

    var self = WorkspaceController;

    return WorkspaceController;
});