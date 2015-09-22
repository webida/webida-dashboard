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

(function($){
    'use strict';
    
    var ROUTING_PAGE_CLASS = 'routing-page';
    var ACTIVE_PAGE_CLASS = 'active-page';
    var PAGE_ON_EVENT = 'page-on';
    var PAGE_OFF_EVENT = 'page-off';
    
    var router = {
        init: function() {
            $('head').append('<style id="router-style">'+ 
                        '.' + ROUTING_PAGE_CLASS + '{display: none;}' +
                        '.' + ACTIVE_PAGE_CLASS + '{display: block;}' +
                        '</style>');
            
            $(window).on('hashchange', function () {
                console.log('hashchange', location.hash);
                router.route();
            });
            
            $('[data-hash]').trigger(PAGE_INIT_EVENT);

            router.route();
        },
        
        route: function() {
            var hash = window.location.hash;
            var params = hash.split('/');
            var target = params[0];

            console.log('route', target, params);
            
            var pages = $('[data-hash]');
            
            // [data-hash] attribute usage
            /*
            data-hash="#"   => display when default
            data-hash="# #workspace"   => display when default, #workspace
            data-hash="*"   => display always
            data-hash="* -#workspace"   => display always except #workspace
            data-hash="-#workspace"     => never display
            */
            
            target = (target === '') ? '#' : target;  // '' and '#' are the same
            
            pages.each(function(i, e){
                var eHashs = e.getAttribute('data-hash').split(' ');
                var show = false;
                
                eHashs.forEach(function(eHash) {
                    if (eHash === '*') {
                        show = true;
                    } else if (eHash.substr(0, 1) === '-') {
                        var hBody = eHash.substr(1);
                        if (hBody === target) {
                            show = false;
                        }
                    } else {
                        if (eHash === target) {
                            show = true;
                        }
                    }
                });
                
                var elem = $(e);
                if (!e.classList.contains(ROUTING_PAGE_CLASS)) {
                    e.classList.add(ROUTING_PAGE_CLASS);
                }
                if (show) {
                    if (!e.classList.contains(ACTIVE_PAGE_CLASS)) {
                        e.classList.add(ACTIVE_PAGE_CLASS);
                        elem.trigger(PAGE_ON_EVENT, params);
                    }
                } else {
                    if (e.classList.contains(ACTIVE_PAGE_CLASS)) {
                        e.classList.remove(ACTIVE_PAGE_CLASS);
                        elem.trigger(PAGE_OFF_EVENT, params);
                    }
                }
            });
        },

        // usage: changePage('#workspace', 'count', 10); =? location.hash = '#workspace/count/10';
        changePage: function (hash) {
            var params = Array.prototype.slice.call(arguments, 1);
            
            console.log('changePage', hash, params);
            
            for(var i in params) {
                hash += '/' + params[i];
            }
            
            location.hash = hash;
        }
    };
    
    router.init();
    
})(jQuery);
