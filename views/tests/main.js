// Requirejs Configuration Options
require.config({
    // to set the default folder
    baseUrl: '../scripts',

    // paths: maps ids with paths (no extension)
    paths: {
        "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min",
        'jasmine': ['../node_modules/jasmine-core/lib/jasmine-core/jasmine'],
        'jasmine-html': ['../node_modules/jasmine-core/lib/jasmine-core/jasmine-html'],
        'jasmine-boot': ['../node_modules/jasmine-core/lib/jasmine-core/boot']
    },
    // shim: makes external libraries compatible with requirejs (AMD)
    shim: {
        'jasmine-html': {
            deps: ['jasmine']
        },
        'jasmine-boot': {
            deps: ['jasmine', 'jasmine-html']
        }
    }
});


require(['jasmine-boot'], function() {
    require(['../tests/01_SimpleJasmineTests'], function() {
        //trigger Jasmine
        window.onload();
    })
});