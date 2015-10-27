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
    'q',
    'webida',
], function (Q, webida) {
    'use strict';
    var FS = function () {};
    var USERINFO_PATH = '.userinfo';

    function convertToError(e) {
        if (!e) {
            e = '{ reason: "Unknown error!" }';
        }

        return new Error(e);
    }

    $.extend(FS.prototype, {
        init: function () {
            var _this = this;
            var fs = webida.fs;
            var defer = Q.defer();

            if (_this.fs) {
                defer.resolve();
            } else {
                fs.getMyFSInfos(function (e, fsInfos) {
                    if (e || fsInfos.length === 0) {
                        fs.addMyFS(function (err, fsinfo) {
                            if (err || !fsinfo) {
                                defer.reject(convertToError(e));

                            } else {
                                _this.fs = fs.mountByFSID(fsinfo.fsid);
                                _this.createDirectory(USERINFO_PATH, false).then(function () {
                                    defer.resolve();
                                }).fail(function (e) {
                                    defer.reject(e);
                                });
                            }
                        });

                    } else {
                        _this.fs = fs.mountByFSID(fsInfos[0].fsid);
                        defer.resolve();
                    }
                });
            }

            return defer.promise;
        },

        _wrapFunction: function (func) {
            var _this = this;
            var defer = Q.defer();
            var args = Array.prototype.slice.call(arguments, 1);
            args.unshift(defer);

            _this.init().then(function () {
                func.apply(_this, args);
            });

            return defer.promise;
        },

        getFSId: function () {
            return this._wrapFunction(function (defer) {
                defer.resolve(this.fs.fsid);
            });
        },

        readFile: function (filePath) {
            return this._wrapFunction(function (defer, filePath) {
                this.fs.readFile(filePath, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, filePath);
        },

        list: function (filePath, isRecursive) {
            return this._wrapFunction(function (defer, filePath, isRecursive) {
                this.fs.list(filePath, isRecursive, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, filePath, isRecursive);
        },

        addAlias: function (projPath, expire) {
            return this._wrapFunction(function (defer, projPath, expire) {
                this.fs.addAlias(projPath, expire, function (e, info) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(info);
                    }
                });
            }, projPath, expire);
        },

        createDirectory: function (path, isRecursive) {
            return this._wrapFunction(function (defer, path, isRecursive) {
                this.fs.createDirectory(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        },

        writeFile: function (path, data) {
            return this._wrapFunction(function (defer, path, data) {
                this.fs.writeFile(path, data, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, data);
        },

        stat: function (pathList) {
            return this._wrapFunction(function (defer, pathList) {
                this.fs.stat(pathList, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, pathList);
        },

        exists: function (path) {
            return this._wrapFunction(function (defer, path) {
                this.fs.exists(path, function (e, flag) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        if (flag) {
                            defer.resolve();
                        } else {
                            defer.reject();
                        }
                    }
                });
            }, path);
        },

        getQuotaLimit: function () {
            var _this = this;
            return new Promise(function(resolve, reject) {
                console.log('limit this', _this);
                _this.fs.getQuotaLimit(function (e, limit) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve(limit);
                    }
                });
            });
        },

        getQuotaUsage: function () {
            var _this = this;
            return new Promise(function(resolve, reject) {
                console.log('usage this', _this);
                _this.fs.getQuotaUsage(function (e, usage) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve(usage);
                    }
                });
            });
        },

        exec: function (path, opts) {
            return this._wrapFunction(function (defer, path, opts) {
                this.fs.exec(path, opts, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, path, opts);
        },

        delete: function (path, isRecursive) {
            return this._wrapFunction(function (defer, path, isRecursive) {
                this.fs.delete(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        },
        
        rename: function (oldPath, newPath) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                console.log('rename this', this);
                _this.fs.move(oldPath, newPath, function(e) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve();
                    }                        
                });
            });
        },
    });

    if (FS.instance === undefined) {
        FS.instance = new FS();
    }

    return FS.instance;
});
