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

/* usage
var myAlert = ModalFactory('#common-modal', '#alert-template');
myAlert.setup({
    title: 'modal title',
    message: 'modal message',
    buttons: [{
        id: 'ok-button',            // default: undefined
        name: 'Ok',                 // default: 'Ok'
        close: false,               // default: false
        class: 'btn btn-primary',   // default: 'btn-default'
        default: true,              // default: false
        disabled: false,            // default: false
        onclick: function (e) {     // default: undefined
            console.log('Ok');
            myAlert.close();
        }
    }, {
        name: 'Cancel',
        close: true,
    }],
    onopen: function(e) {       // shown.bs.modal event
        
    },
    onclose: function(e) {      // hidden.bs.modal event
        //
    }
});
myAlert.popup();
// */

define([], function () {
    'use strict';
    
    var Modal = function (modalSelector, templateSelector) {
        this.modalSelector = modalSelector;
        this.modalObj = $(modalSelector);
        this.templateSelector = templateSelector;
        this.templateObj = Handlebars.compile($(templateSelector).html());
        this.lastClickedButton = undefined;
    };
    
    Modal.prototype.setup = function (data) {
        var _this = this;
        this.data = data;

        this.modalObj.find('.modal-content').html(this.templateObj(data));

        if (data.onopen) {
            this.modalObj.on('shown.bs.modal', data.onopen);
        }

        if (data.onclose) {
            this.modalObj.on('hidden.bs.modal', data.onclose);
        }

        if (data.buttons && data.buttons.constructor === Array && data.buttons.length > 0) {
            var buttonObjs = this.modalObj.find('.modal-footer button');
            data.buttons.forEach(function (button, i) {
                var buttonObj = buttonObjs[i];

                if (buttonObj) {
                    $(buttonObj).on('click', button, function (e) {
                        button = e.data;
                        _this.lastClickedButton = {
                            id: button.id,
                            name: button.name
                        };
                        if (button.onclick) {
                            button.onclick(e);
                        }
                    });
                }
                if (buttonObj && button.default) {
                    _this.modalObj.on('shown.bs.modal', buttonObj, function (e) {
                        var obj = e.data;
                        obj.focus();
                    });
                }
            });
        }
    };

    Modal.prototype.popup = function () {
        var _this = this;
        var promise = new Promise(function (resolve/*, reject*/) {
            _this.modalObj.one('hidden.bs.modal', function () {
                resolve(_this.lastClickedButton);
                _this.lastClickedButton = undefined;
            });
        });
        this.modalObj.modal();
        return promise;
    };

    Modal.prototype.close = function () {
        this.modalObj.find('button.close').click();
    };

    var ModalFactory = function (selector, template) {
        return new Modal(selector, template);
    };

    return ModalFactory;
});