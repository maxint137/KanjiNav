module.exports = function(config) {
    config.set({
        // basePath: "./tests",
        files: [
            "https://code.jquery.com/jquery-1.11.2.min.js",
            { pattern: "scripts/**/*.ts" },
            { pattern: "tests/**/*.ts" },
        ],
        preprocessors: {
            //"scripts/**/*.ts": ["karma-typescript", "coverage"],
            "**/*.ts": ["karma-typescript"],
        },
        frameworks: ["jasmine", "karma-typescript"],
        reporters: ["progress", "karma-typescript"],
        browsers: ["Chrome"]
    });
};