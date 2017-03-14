var gulp = require("gulp");
var replace = require('gulp-replace-path');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var pump = require("pump");

gulp.task('default', ['copy_manifest', 'copy_views', 'compress1', 'compress2', 'copy_extern', 'copy_extern_images', 'copy_fonts', 'cdn2local']);

gulp.task('cdn2local', function() {
    return gulp.src(['./views/navigateKanji.html',
            './views/scripts/require-setup.js'
        ], { base: 'views' })
        .pipe(replace(/"https.*cloudflare.*\/(.*)"/g, '"../extern/$1"'))
        .pipe(gulp.dest('./setup/chromexDebug/views'));
});

gulp.task('copy_manifest', function() {
    return gulp.src([
            './chromex/setup/manifest.json',
            './chromex/setup/*.png',
        ])
        .pipe(gulp.dest('./setup/chromexDebug'));

});

gulp.task('copy_views', function() {
    return gulp.src([
            './views/style.css',
            './views/festyle.css',
            './views/scripts/**/*.ts', '!./views/js/**/server*.ts',
            './views/scripts/**/*.js', '!./views/scripts/require-setup.js',
            './views/js/**/*.js', '!./views/js/**/server*.js',
            './views/js/**/*.map', '!./views/js/**/server*.map'
        ], { base: 'views' })
        .pipe(gulp.dest('./setup/chromexDebug/views'));

});

gulp.task('copy_extern', function() {
    return gulp.src([
            './extern/fullscreen.js',
            './node_modules/requirejs/require.js',
            './node_modules/jquery/dist/jquery.min.js',
            "./node_modules/font-awesome/css/font-awesome.css",
            './node_modules/jqueryui/jquery-ui.css',
            './node_modules/jqueryui/jquery-ui.min.js',
            './node_modules/bootstrap/dist/js/bootstrap.min.js',
            './node_modules/bootstrap/dist/css/bootstrap.min.css',
            './views/node_modules/d3/d3*.js',
            './views/node_modules/js-cookie/src/js.cookie.js',
            './views/node_modules/webcola/WebCola/cola*js'
        ])
        .pipe(gulp.dest('./setup/chromexDebug/extern'))
});

gulp.task('compress1', function(cb) {
    pump([
            gulp.src('./node_modules/requirejs/require.js')
            .pipe(rename("require.min.js")),
            uglify(),
            gulp.dest('./setup/chromexDebug/extern')
        ],
        cb
    );
});

gulp.task('compress2', function(cb) {
    pump([
            gulp.src('./views/node_modules/js-cookie/src/js.cookie.js')
            .pipe(rename("js.cookie.min.js")),
            uglify(),
            gulp.dest('./setup/chromexDebug/extern')
        ],
        cb
    );
});

gulp.task('copy_extern_images', function() {
    return gulp.src([
            './node_modules/jqueryui/images/ui-icons_222222_256x240.png',
            './node_modules/jqueryui/images/ui-bg_highlight-soft_100_eeeeee_1x100.png',
            './node_modules/jqueryui/images/ui-bg_glass_100_f6f6f6_1x400'
        ])
        .pipe(gulp.dest('./setup/chromexDebug/extern/images'))
});


gulp.task('copy_fonts', function() {
    return gulp.src([
            './node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf',
            './node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2'
        ])
        .pipe(gulp.dest('./setup/chromexDebug/fonts'))
});