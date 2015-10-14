var gulp = require('gulp');                         // https://github.com/gulpjs/gulp
var jade = require('gulp-jade');                    // https://github.com/phated/gulp-jade
var concat = require('gulp-concat');                // https://github.com/contra/gulp-concat
var less = require('gulp-less');                    // https://github.com/plus3network/gulp-less
var jshint = require ('gulp-jshint');               // https://github.com/spalger/gulp-jshint
var uglify = require ('gulp-uglify');                           // https://github.com/terinjokes/gulp-uglify
var ngAnnotate = require('gulp-ng-annotate');                   // https://github.com/Kagami/gulp-ng-annotate
var debug = require('gulp-debug');                              // https://github.com/sindresorhus/gulp-debug
var sourcemaps = require('gulp-sourcemaps');                    // https://github.com/floridoo/gulp-sourcemaps
var LessPluginCleanCSS = require('less-plugin-clean-css');      // https://github.com/less/less-plugin-clean-css
var LessPluginAutoPrefix = require('less-plugin-autoprefix');   // https://github.com/less/less-plugin-autoprefix
var cleancss = new LessPluginCleanCSS({ advanced: true });
var autoprefix = new LessPluginAutoPrefix({ browsers: ["last 2 versions"] });

var DEBUG = true;

var SOURCES = {
  TEMPLATES: './src/**/*.jade',
  APP: './src/**/*.js',
  STYLES: './jumplink-cms-angular.less',
}

var WATCHES = {
  LIBS: SOURCES.LIBS,
  TEMPLATES: SOURCES.TEMPLATES,
  APP: SOURCES.APP,
  STYLES: './src/**/*.less'
}

var DESTS = {
  LIBS: './dist',
  TEMPLATES: './dist',
  APP: './dist',
  STYLES: './dist'
}

/**
 * Seperate watches to work with browser sync,
 * This wasn't possible with gulp-watch, just sass was working with gulp-watch
 * @see https://github.com/BrowserSync/recipes/tree/master/recipes/gulp.jade
 */
gulp.task('jade-watch', ['templates']);
gulp.task('app-watch', ['app']);

/**
 * The default gulp task
 */
gulp.task('default', ['templates', 'app', 'styles'], function () {
  if(DEBUG) {
    gulp.watch(WATCHES.STYLES, ['styles']);
    gulp.watch(WATCHES.APP, ['app-watch']);
    gulp.watch(WATCHES.LIBS, ['libs-watch']);
    gulp.watch(WATCHES.TEMPLATES, ['jade-watch']);
  }
});

gulp.task('templates', function() {
  var locals = {debug: DEBUG};
  return gulp.src(SOURCES.TEMPLATES)
    .pipe(jade({locals: locals}).on('error', console.log))
    .pipe(debug({title: 'templates:'}))
    .pipe(gulp.dest(DESTS.TEMPLATES))
});

gulp.task('app', function() {
  return gulp.src(SOURCES.APP)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(jshint())
    .pipe(jshint.reporter('default')) 
    .pipe(concat('jumplink-cms-angular.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'app:'}))
    .pipe(gulp.dest(DESTS.APP));
});

gulp.task('styles', function () {
  return gulp.src(SOURCES.STYLES)
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [autoprefix, cleancss]
    }))
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'styles:'}))
    .pipe(gulp.dest(DESTS.STYLES))
});