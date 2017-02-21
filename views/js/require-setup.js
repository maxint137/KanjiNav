var require = {
    waitSeconds: 120,
    shim: {
        "jquery-ui": {
            deps: ['jquery'],
            exports: 'jQuery.ui'
        },
        "bootstrap": { deps: ['jquery', 'jquery-ui'] },
        "js-cookie": {}
    },
    paths: {
        "jquery": "//code.jquery.com/jquery-2.1.1.min",
        "jquery-ui": "//code.jquery.com/ui/1.12.1/jquery-ui",
        "d3": "/node_modules/d3/d3",
        "cola": "/node_modules/webcola/WebCola/cola",
        "bootstrap": "//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min",
        "js-cookie": "/node_modules/js-cookie/src/js.cookie"
    }
};