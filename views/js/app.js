// File: /js/app.js

// 'jquery' returns the jQuery object into '$'
//
// 'bootstrap' does not return an object. Must appear at the end

require(['jquery', 'bootstrap', 'bootstrap-combobox'], function($) {

    // DOM ready
    $(function() {

        $('.combobox').combobox();
    });
});


var fe = {};
// the variables that manage everything, basically
require(['js/kanjiNav', 'js/frontend', 'cola', 'js-cookie'], function(kanjiNav, frontend, cola, js_cookie) {

    fe = new frontend(new kanjiNav.Graph(), cola, js_cookie);

    // get first node
    fe.main(fe.getParameterByName('start') || '楽しい');
});