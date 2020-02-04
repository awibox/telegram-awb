var gulp = require('gulp');
var gulpLoadPlugin = require('gulp-load-plugins')();

gulp.task('js', function () {
    return gulp.src([
        'node_modules/long/dist/long.min.js',
        'node_modules/zlibjs/bin/gunzip.min.js',
        'node_modules/rusha/rusha.min.js',
        'node_modules/ioc-js/dist/ioc-js.min.js',

        'src/vendor/**/*.js',
        'src/js/**/*.js',

        'src/telegramApi.js',
        'src/IoC.js'
    ])
        .pipe(gulpLoadPlugin.concat('mtproto.js'))
        .pipe(gulpLoadPlugin.rename({suffix: '.min'}))
        .pipe(gulpLoadPlugin.uglify())
        .pipe(gulp.dest('../dist'));
});

gulp.task('build', ['js']);
