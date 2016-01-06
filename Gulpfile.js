'use strict';

var gulp = require('gulp');
var del = require('del');
var babel = require('gulp-babel');

gulp.task('clean', function(cb){
   del(['lib']).then(function(){
      cb();
   });
});

gulp.task('babel', ['clean'], function(){
   return gulp.src(['src/**/*.js', 'src/**/*.jsx'])
      .pipe(babel({stage:0}))
      .pipe(gulp.dest('lib'));
});
