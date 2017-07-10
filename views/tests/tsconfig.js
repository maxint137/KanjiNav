// mocha -w -r views\tests\tsconfig.js  views\tests\localDictionaryTest.ts --watch-extensions ts
const tsNode = require('ts-node');

tsNode.register({

    "fast": true,

    "compilerOptions": {
        //"target": "es5",

        //        "allowJs": true,

        //"lib": ["dom", "es2015.promise", "es5"],
    }
});

tsNode.allowJs = true;