// Assigning modules to local variables
var gulp = require('gulp');
var webpack = require('webpack-stream');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');

// Default task
gulp.task('default', ['minify-js', 'copy', 'webpack']);

// webpack
gulp.task('webpack', function() {
  return gulp.src('app/components/Main.js')
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('public'));
});

// Minify JS
gulp.task('minify-js-0', function() {
    return gulp.src('app/components/contact_me.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('minify-js-1', function() {
    return gulp.src('app/components/freelancer.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('minify-js-2', function() {
    return gulp.src('app/components/jqBootstrapValidation.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('minify-js', ['minify-js-0', 'minify-js-1', 'minify-js-2']);

// Copy
gulp.task('copy-0', function() {
    return gulp.src(['img/**'])
        .pipe(gulp.dest('public/img'))
})

gulp.task('copy-1', function() {
    return gulp.src(['index.html'])
        .pipe(gulp.dest('public/'))
})

gulp.task('copy', ['copy-0', 'copy-1']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// // Watch Task that compiles LESS and watches for HTML or JS changes and reloads with browserSync
gulp.task('dev', ['browserSync', 'minify-js', 'webpack'], function() {
    gulp.watch('app/components/*.js', ['minify-js']);
    gulp.watch('app/components/*.jsx', ['webpack']);
    gulp.watch('app/css/*.css', ['webpack']);
    gulp.watch('app/less/*.less', ['webpack']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('public/*.html', browserSync.reload);
    gulp.watch('public/*.js', browserSync.reload);
});
