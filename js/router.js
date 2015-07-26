(function ($) {
    var pageContainer = {};
    var routingTable = {};

    $(window).on('hashchange', function () {
        // On every hash change the render function is called with the new hash.
        // This is how the navigation of our app happens.
        var hash = window.location.hash;
        var params = hash.split('/');
        var sep = hash.indexOf('/');
        if (sep >= 0) {
            hash = hash.substr(0, sep);
        }
        
        console.log(hash, params);
        var rt = routingTable[hash];
        if (rt) {
            $.changePage(rt.page, params);
        }
    });

    $.setPageContainer = function (container) {
        pageContainer = $(container);
        var pages = pageContainer.find('.page-wrapper');
        for (var i = 0; i < pages.length; ++i) {
            console.log(i);
            var page = $(pages[i]);
            routingTable[page.attr('data-hash')] = {
                'page': page
            };
        }
    };

    $.changePage = function (nextPage, params) {
        var beforePage = $('.active-page');
        nextPage = $(nextPage);
        $('.page-wrapper').removeClass('active-page');
        nextPage.addClass('active-page');
        beforePage.trigger('page-off');
        nextPage.trigger('page-on', params);
    };
}(jQuery));