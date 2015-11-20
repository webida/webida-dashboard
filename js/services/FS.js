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
    'webida',
], function (webida) {
    'use strict';
    var USERINFO_PATH = '.userinfo';

    function convertToError(e) {
        if (!e) {
            e = '{ reason: "Unknown error!" }';
        }
        return new Error(e);
    }

    var Fs = {
        init: function () {
            var fs = webida.fs;
            if (!Fs._initialized) {
                Fs._initialized = new Promise(function (resolve, reject) {
                    if (Fs.fs) {
                        resolve();
                    } else {
                        fs.getMyFSInfos(function (e, fsInfos) {
                            if (e || fsInfos.length === 0) {
                                fs.addMyFS(function (err, fsinfo) {
                                    if (err || !fsinfo) {
                                        reject(convertToError(e));
                                    } else {
                                        Fs.fs = fs.mountByFSID(fsinfo.fsid);
                                        Fs.createDirectory(USERINFO_PATH, false).then(function () {
                                            resolve();
                                        }).catch(function (e) {
                                            reject(e);
                                        });
                                    }
                                });
                            } else {
                                Fs.fs = fs.mountByFSID(fsInfos[0].fsid);
                                resolve();
                            }
                        });
                    }
                });
            }
            return Fs._initialized;
        },

        _wrapFunction: function (func) {
            var args = Array.prototype.slice.call(arguments, 1);
            return new Promise(function (resolve, reject) {
                args.unshift({resolve: resolve, reject: reject});
                func.apply(Fs, args);
            });
        },

        getFSId: function () {
            return Fs._wrapFunction(function (defer) {
                defer.resolve(Fs.fs.fsid);
            });
        },

        readFile: function (filePath) {
            return Fs._wrapFunction(function (defer, filePath) {
                Fs.fs.readFile(filePath, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, filePath);
        },

        list: function (filePath, options) {
            var listFn = (options ? Fs.fs.listEx : Fs.fs.list).bind(Fs.fs);
            return new Promise(function (resolve, reject) {
                listFn(filePath, options, function (e, data) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve(data);
                    }
                });
            });
        },

        addAlias: function (projPath, expire) {
            return Fs._wrapFunction(function (defer, projPath, expire) {
                Fs.fs.addAlias(projPath, expire, function (e, info) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(info);
                    }
                });
            }, projPath, expire);
        },

        createDirectory: function (path, isRecursive) {
            return Fs._wrapFunction(function (defer, path, isRecursive) {
                Fs.fs.createDirectory(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        },

        writeFile: function (path, data) {
            return Fs._wrapFunction(function (defer, path, data) {
                Fs.fs.writeFile(path, data, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, data);
        },

        stat: function (pathList) {
            return Fs._wrapFunction(function (defer, pathList) {
                Fs.fs.stat(pathList, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, pathList);
        },

        exists: function (path) {
            return Fs._wrapFunction(function (defer, path) {
                Fs.fs.exists(path, function (e, flag) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        if (flag) {
                            defer.resolve();
                        } else {
                            defer.reject(path + ' is not exist');
                        }
                    }
                });
            }, path);
        },

        getQuotaLimit: function () {
            return new Promise(function (resolve, reject) {
                Fs.fs.getQuotaLimit(function (e, limit) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve(limit);
                    }
                });
            });
        },

        getQuotaUsage: function () {
            return new Promise(function (resolve, reject) {
                Fs.fs.getQuotaUsage(function (e, usage) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve(usage);
                    }
                });
            });
        },

        exec: function (path, opts) {
            return Fs._wrapFunction(function (defer, path, opts) {
                Fs.fs.exec(path, opts, function (e, data) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve(data);
                    }
                });
            }, path, opts);
        },

        delete: function (path, isRecursive) {
            return Fs._wrapFunction(function (defer, path, isRecursive) {
                Fs.fs.delete(path, isRecursive, function (e) {
                    if (e) {
                        defer.reject(convertToError(e));
                    } else {
                        defer.resolve();
                    }
                });
            }, path, isRecursive);
        },

        rename: function (oldPath, newPath) {
            return new Promise(function (resolve, reject) {
                Fs.fs.move(oldPath, newPath, function (e) {
                    if (e) {
                        reject(convertToError(e));
                    } else {
                        resolve();
                    }
                });
            });
        }

    };

    return Fs;
});
