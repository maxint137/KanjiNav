var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('test', function() {
  var error = false;
  gulp.
    src('./test.js').
    pipe(mocha()).
    on('error', function() {
      console.log('Tests failed!');
      error = true;
      
      console.log("\007");
    }).
    on('end', function() {
      if (!error) {
        console.log('Tests succeeded!');
      }
    });
});

gulp.task('watch', function() {
  gulp.watch(['./api.js', './index.js', './../model/models.js', './test.js'], ['test']);
});
