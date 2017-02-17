// File: /js/app.js

// 'jquery' returns the jQuery object into '$'
//
// 'bootstrap' does not return an object. Must appear at the end

require(['jquery', 'bootstrap'], function($) {

    // DOM ready
    $(function() {

        // Twitter Bootstrap 3 carousel plugin
        //$("#element").carousel();
    });
});

// the variables that manage everything, basically
require(['js/kanjiNav', 'js/frontend', 'cola'], function(kanjiNav, frontend, cola) {

    var graph = new kanjiNav.Graph(); //getParameterByName('JLPT'));

    var fe = new frontend(graph, cola);

    // get first node
    fe.main(fe.getParameterByName('start') || '楽しい');

    //navigateToWord($("#word").val()) {

});