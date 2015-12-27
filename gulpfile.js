var fs = require('fs'); 
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
  LIBS_CORE: [
    //- masonry and imagesloaded
    'lib/jquery/dist/jquery.js',
    'lib/jquery-bridget/jquery.bridget.js',
  
    //- angular
    'lib/angular/angular.js',
    'lib/angular-i18n/angular-locale_de.js',
    'lib/angular-fullscreen/src/angular-fullscreen.js',
    'lib/angular-animate/angular-animate.js',
    'lib/angular-ui-router/release/angular-ui-router.js',
    'lib/angular-sanitize/angular-sanitize.js',
    'lib/angular-touch/angular-touch.js',
  
    //- html, css, javascript beautifier
    'lib/js-beautify/js/lib/beautify.js',
    'lib/js-beautify/js/lib/beautify-css.js',
    'lib/js-beautify/js/lib/beautify-html.js',
  
    //- async: https://github.com/caolan/async
    'lib/async/lib/async.js',
  
    //- generic angular filters: https://github.com/niemyjski/angular-filters
    'lib/angular-filters/dist/angular-filters.js',

    //- https://github.com/pc035860/angular-highlightjs
    'lib/highlightjs/highlight.pack.js',
    'lib/angular-highlightjs/build/angular-highlightjs.js',
  
    //- Bring in the socket.io client
    'lib/socket.io-client/socket.io.js',
    'lib/sails.io.js/sails.io.js',
    'lib/angularSails/dist/ngsails.io.js',
  ],
  LIBS_BOOTSTRAP: [
    'lib/angular-strap/dist/angular-strap.js',
  
    //- AngularJS-Toaster: https://github.com/jirikavi/AngularJS-Toaster: https://github.com/jirikavi/AngularJS-Toaster
    'lib/AngularJS-Toaster/toaster.js',
  
    //-oh https://github.com/JumpLink/angular-toggle-switch
    'lib/angular-bootstrap-toggle-switch/angular-toggle-switch.js',
  ],
  LIBS_MATERIAL: [

  ],
  APP_CORE: [
    './src/**/*.js',
    '!./src/**/*material*.js',
    '!./src/**/*bootstrap*.js',
  ],
  APP_BOOTSTRAP: [
    './src/**/*bootstrap*.js',
  ],
  APP_MATERIAL: [
    './src/**/*material*.js',
  ],
  TEMPLATES: [
    './src/**/*.jade',
    '!./src/**/*fallback*.jade',
  ],
  STYLES_CORE: [
    './jumplink-cms-angular-core.less',
  ],
  STYLES_BOOTSTRAP: [
    './jumplink-cms-angular-bootstrap.less',
  ],
  STYLES_MATERIAL: [
    './jumplink-cms-angular-material.less',
  ],
  
};

var WATCHES = {
  LIBS_CORE: SOURCES.LIBS_CORE,
  LIBS_BOOTSTRAP: SOURCES.LIBS_BOOTSTRAP,
  LIBS_MATERIAL: SOURCES.LIBS_MATERIAL,
  TEMPLATES: SOURCES.TEMPLATES,
  APP: './src/**/*.js',
  STYLES: './src/**/*.less',
};

var DESTS = {
  LIBS_CORE: './dist',
  LIBS_BOOTSTRAP: './dist',
  LIBS_MATERIAL: './dist',
  TEMPLATES: './dist',
  APP: './dist',
  STYLES: './dist'
};

// check if libs are exists
SOURCES.LIBS_CORE.forEach(function(path) {
  if(!fs.existsSync(path)) {
    throw path+" not found!";
  }
});

SOURCES.LIBS_BOOTSTRAP.forEach(function(path) {
  if(!fs.existsSync(path)) {
    throw path+" not found!";
  }
});

SOURCES.LIBS_MATERIAL.forEach(function(path) {
  if(!fs.existsSync(path)) {
    throw path+" not found!";
  }
});

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
gulp.task('default', ['bootstrap', 'material'], function () {
  if(DEBUG) {
    gulp.watch(WATCHES.STYLES, ['styles']);
    gulp.watch(WATCHES.APP, ['app-watch']);
    gulp.watch(WATCHES.LIBS_CORE, ['libs-core-watch']);
    gulp.watch(WATCHES.LIBS_BOOTSTRAP, ['libs-bootstrap-watch']);
    gulp.watch(WATCHES.LIBS_MATERIAL, ['libs-material-watch']);
    gulp.watch(WATCHES.TEMPLATES, ['jade-watch']);
  }
});

/**
 * 
 */
gulp.task('bootstrap', ['templates', 'app-bootstrap', 'libs-bootstrap', 'styles-bootstrap'], function () {
  if(DEBUG) {
    gulp.watch(WATCHES.STYLES, ['styles']);
    gulp.watch(WATCHES.APP, ['app-watch']);
    gulp.watch(WATCHES.LIBS_BOOTSTRAP, ['libs-bootstrap-watch']);
    gulp.watch(WATCHES.TEMPLATES, ['jade-watch']);
  }
});

/**
 * 
 */
gulp.task('material', ['templates', 'app-material', 'libs-material', 'styles-material'], function () {
  if(DEBUG) {
    gulp.watch(WATCHES.STYLES, ['styles']);
    gulp.watch(WATCHES.APP, ['app-watch']);
    gulp.watch(WATCHES.LIBS_BOOTSTRAP, ['libs-bootstrap-watch']);
    gulp.watch(WATCHES.TEMPLATES, ['jade-watch']);
  }
});

gulp.task('templates', function() {
  var locals = {debug: DEBUG};
  return gulp.src(SOURCES.TEMPLATES)
    .pipe(jade({locals: locals}).on('error', console.log))
    .pipe(debug({title: 'templates:'}))
    .pipe(gulp.dest(DESTS.TEMPLATES));
});

gulp.task('libs-core', function() {
  return gulp.src(SOURCES.LIBS_CORE)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    // .pipe(jshint())
    // .pipe(jshint.reporter('default')) 
    .pipe(concat('libs.core.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'libs-core:'}))
    .pipe(gulp.dest(DESTS.LIBS_CORE));
});

gulp.task('libs-bootstrap', function() {
  return gulp.src(SOURCES.LIBS_CORE, SOURCES.LIBS_BOOTSTRAP)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    // .pipe(jshint())
    // .pipe(jshint.reporter('default')) 
    .pipe(concat('libs.bootstrap.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'libs-bootstrap:'}))
    .pipe(gulp.dest(DESTS.LIBS_BOOTSTRAP));
});

gulp.task('libs-material', function() {
  return gulp.src(SOURCES.LIBS_CORE, SOURCES.LIBS_MATERIAL)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    // .pipe(jshint())
    // .pipe(jshint.reporter('default')) 
    .pipe(concat('libs.material.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'libs-material:'}))
    .pipe(gulp.dest(DESTS.LIBS_MATERIAL));
});

gulp.task('app-core', function() {
  return gulp.src(SOURCES.APP_CORE)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(jshint())
    .pipe(jshint.reporter('default')) 
    .pipe(concat('jumplink-cms-angular-core.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'app-core:'}))
    .pipe(gulp.dest(DESTS.APP));
});

gulp.task('app-bootstrap', function() {
  return gulp.src(SOURCES.APP_CORE, SOURCES.APP_BOOTSTRAP)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(jshint())
    .pipe(jshint.reporter('default')) 
    .pipe(concat('jumplink-cms-angular-bootstrap.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'app-bootstrap:'}))
    .pipe(gulp.dest(DESTS.APP));
});

gulp.task('app-material', function() {
  return gulp.src(SOURCES.APP_CORE, SOURCES.APP_MATERIAL)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(jshint())
    .pipe(jshint.reporter('default')) 
    .pipe(concat('jumplink-cms-angular-material.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'app-material:'}))
    .pipe(gulp.dest(DESTS.APP));
});

gulp.task('styles-core', function () {
  return gulp.src(SOURCES.STYLES_CORE)
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [autoprefix, cleancss]
    }))
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'styles-core:'}))
    .pipe(gulp.dest(DESTS.STYLES));
});

gulp.task('styles-bootstrap', function () {
  return gulp.src(SOURCES.STYLES_BOOTSTRAP)
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [autoprefix, cleancss]
    }))
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'styles-bootstrap:'}))
    .pipe(gulp.dest(DESTS.STYLES));
});

gulp.task('styles-material', function () {
  return gulp.src(SOURCES.STYLES_MATERIAL)
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [autoprefix, cleancss]
    }))
    .pipe(sourcemaps.write('/'))
    .pipe(debug({title: 'styles-material:'}))
    .pipe(gulp.dest(DESTS.STYLES));
});