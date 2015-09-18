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

    window.router = {
        pageContainer: {},
        routingTable: {},
        
        init: function(container) {
            if (container) {
                router.setPageContainer(container);
            }
            
            $(window).on('hashchange', function () {
                router.route();
            });
            
            if (window.location.hash.length > 0) {
                router.route();
            } else if (router.pageContainer) {
                var activePage = router.pageContainer.find('.default-page');
                router.changePage(activePage.attr('data-hash'));
            } else {
                console.log('routing fail');
            }
        },
        
        route: function() {
            // On every hash change the render function is called with the new hash.
            // This is how the navigation of our app happens.
            var hash = window.location.hash;
            var params = hash.split('/');
            var sep = hash.indexOf('/');
            if (sep >= 0) {
                hash = hash.substr(0, sep);
            }

            console.log('route', hash, params);
            var rt = router.routingTable[hash];
            if (rt) {
                var beforePage = $('.active-page');
                var nextPage = $(rt.page);
                $('.page-wrapper').removeClass('active-page');
                nextPage.addClass('active-page');
                beforePage.trigger('page-off');
                nextPage.trigger('page-on', params);
            }
        },

        setPageContainer: function (container) {
            router.pageContainer = $(container);
            var pages = router.pageContainer.find('.page-wrapper');
            for (var i = 0; i < pages.length; ++i) {
                var page = $(pages[i]);
                router.routingTable[page.attr('data-hash')] = {
                    'page': page
                };
                page.trigger('page-init');
            }
        },

        changePage: function (nextPageHash, params) {
            console.log('changePage', nextPageHash, params);
            location.hash = nextPageHash + (params ? '/' + params : '');
        }
    };
})(jQuery);
