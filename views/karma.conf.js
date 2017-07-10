module.exports = function(config) {
    config.set({
        basePath: '../..',
        files: [
            "./node_modules/jquery/dist/jquery.min.js",
            { pattern: "./scripts/**/*.ts" },
            { pattern: "./tests/**/*.ts" },
        ],
        preprocessors: {
            //"scripts/**/*.ts": ["karma-typescript", "coverage"],
            "**/*.ts": ["karma-typescript"],
        },
        frameworks: ["mocha", "chai", "karma-typescript"],
        reporters: ["progress", "karma-typescript"],
        browsers: ["Chrome"],
        plugins: [
            "karma-mocha",
            "karma-typescript",
            'karma-chrome-launcher',
            "chai"
        ]
    });
};