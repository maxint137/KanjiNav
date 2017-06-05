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
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min",
        "jquery-ui": "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min",
        "d3": "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min",
        "bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min",
        "js-cookie": "https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.3/js.cookie.min",
        "cola": "./node_modules/webcola/WebCola/cola.min",
        "localDictionary": "./js/scripts/localDictionary",
        "serverDictionary": "./js/scripts/serverDictionary",
        "frontend": "./js/scripts/frontend",
        "knModel": "./js/scripts/knModel",
        "data": "./js/scripts/data"
    }
};