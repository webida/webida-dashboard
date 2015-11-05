/* exported Class */
var Class = function (parent) {
    'use strict';
    
    var klass = function () {
        this.init.apply(this, arguments);
    };

    if (parent) {
        var Subclass = function () {};
        Subclass.prototype = parent.prototype;
        klass.prototype = new Subclass();
    }

    klass.prototype.init = function () {};
    klass.prototype.fillFrom = function (obj) {
        function isFillable(o) {
            return (o.hasOwnProperty('fillFrom') && o.fillFrom.constructor === Function) ||
                (o.constructor.prototype.hasOwnProperty('fillFrom') && o.constructor.prototype.fillFrom.constructor ===
                    Function);
        }
        for (var i in obj) {
            if (this.hasOwnProperty(i) || this.constructor.prototype.hasOwnProperty(i)) {
                if (isFillable(this[i])) {
                    this[i].fillFrom(obj[i]);
                } else if (obj[i].constructor === Array && this[i].constructor === Array) {
                    for (var j in obj[i]) {
                        if (obj[i].hasOwnProperty(j)) {
                            this[i][j] = obj[i][j];
                        }
                    }
                } /*else if (obj[i].constructor === Function) {
                    // ignore
                } */else {
                    this[i] = obj[i];
                }
            }
        }
    };

    klass.fn = klass.prototype;
    klass.fn.parent = klass;
    klass._super = klass.constructor.prototype;

    klass.extend = function (obj) {
        var extended = obj.extended;
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                klass[i] = obj[i];
            }
        }
        if (extended) {
            extended(klass);
        }
    };

    klass.include = function (obj) {
        var included = obj.included;
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                klass.fn[i] = obj[i];
            }
        }
        if (included) {
            included(klass);
        }
    };

    return klass;
};