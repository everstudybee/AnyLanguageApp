const {dest, series, src, watch} = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
sass.compiler = require('node-sass'); // from gulp-sass github
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const kit = require('gulp-kit');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const zip = require('gulp-zip');
const del = require('del');
const plumber = require('gulp-plumber');
const notifier = require('gulp-notifier'); // {errorHandler: notifier.error} into plumber

// All paths object
const paths = {
    css: {
        // src: './src/sass/**/*.scss',
        src: './src/modules/main.scss',
        dest: './dist/css',
    },
    html: {
        // src: './src/kit/**/*.kit',
        src: './src/modules/index.kit',
        dest: './dist',
    },
    js: {
        src: [
            './src/js/project.js',
            './src/js/alert.js',
        ],
        path: 'script.js',
        dest: './dist/js',
    },
    img: {
        src: './src/img/**/*.{png,jpg,jpeg,svg,gif}',
        dest: './dist/img',
    },
    server: {
        baseDir: './dist',
    },
    zip: {
        src: [
            './**/*',
            '!./dist/**/*',
            '!./node_modules/**/*',
            '!./project.zip',
        ],
        dest: './',
    },
    del: {
        dest: './dist/**/*',
    },
};

// Compile CSS from Sass
function css(done) {
    const postcssPlugins = [autoprefixer, cssnano];
    src(paths.css.src)
        .pipe(plumber({errorHandler: notifier.error}))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'})) //nested, expanded, compressed, compact
        // .pipe(postcss(postcssPlugins))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.css.dest));
    done();
}

// HTML kit templating
function html(done) {
    src(paths.html.src)
        .pipe(plumber({errorHandler: notifier.error}))
        .pipe(kit())
        // .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(dest(paths.html.dest));
    done();
}

// Compile Javascript
function js(done) {
    src(paths.js.src)
        .pipe(plumber({errorHandler: notifier.error}))
        .pipe(sourcemaps.init())
        .pipe(babel({presets: ['@babel/env']}))
        .pipe(concat({path: paths.js.path}))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.js.dest));
    done();
}

// Images optimization
function img(done) {
    const imageminPlugins = [
        imagemin.gifsicle(),
        imagemin.mozjpeg(),
        imagemin.optipng(),
        imagemin.svgo()];
    src(paths.img.src)
        .pipe(plumber({errorHandler: notifier.error}))
        .pipe(cache(imagemin(imageminPlugins, {verbose: true})))
        .pipe(dest(paths.img.dest));
    done();
}

// Cleans graphic cache in img() function
function cleanAllCache(done) {
    cache.clearAll();
    done();
}

// Zip project
function zipProject(done) {
    src(paths.zip.src)
        .pipe(plumber({errorHandler: notifier.error}))
        .pipe(zip('project.zip'))
        .pipe(dest(paths.zip.dest));
    done();
}

// Clean `dist` directory
function cleanDist(done) {
    del(paths.del.dest);
    done();
}

// Init BrowserSync in `dist` directory
function server(done) {
    browserSync.init({
        server: {
            baseDir: paths.server.baseDir,
        },
        browser: 'firefox',
    });
    done();
}

// Reload the server
function reloadServer(done) {
    browserSync.reload();
    done();
}

// Watch all changes
function watchAll(done) {
    watch(paths.css.src, {events: 'all', ignoreInitial: false}, series(css, reloadServer));
    watch(paths.html.src, {events: 'all', ignoreInitial: false}, series(html, reloadServer));
    watch(paths.js.src, {events: 'all', ignoreInitial: false}, series(js, reloadServer));
    watch(paths.img.src, {events: 'all', ignoreInitial: false}, series(img, reloadServer));
    done();
}

// Gulp options
exports.default = series(watchAll, server); // gulp - start Gulp
exports.cac = series(cleanAllCache); // gulp cca - clear cached images
exports.zip = series(zipProject); // gulp zip - zip all project without dist and node_modules
exports.clean = series(cleanDist); // gulp clean - delete all data in dist folder to create it from scratch
exports.rebuild = series(img, html, css, js); // gulp rebuild - rebuild all data afer clean or after moving and unpacking