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
        "jquery": "../../extern/jquery-2.2.4.min",
        "jquery-ui": "../../extern/jquery-ui.min",
        "d3": "./node_modules/d3/d3",
        "cola": "./node_modules/webcola/WebCola/cola",
        "bootstrap": "../../extern/bootstrap.min",
        "js-cookie": "./node_modules/js-cookie/src/js.cookie"
    }
};