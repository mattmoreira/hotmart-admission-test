const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const bowerfiles = require('main-bower-files');

const $ = gulpLoadPlugins({camelize:true});
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src('assets/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.cleanCss())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('build/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', () => {
  return gulp.src('assets/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('build/scripts'))
    .pipe(reload({stream: true}));
});

gulp.task('images', () => {
  return gulp.src(['assets/images/**/*', '!assets/images/icos/*', '!assets/images/icos/'])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('build/images'));
});

gulp.task('fonts', () => {
  return gulp.src(bowerfiles('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('assets/fonts/**/*'))
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('sprites', () => {
  var icons = gulp.src('assets/images/icos/*.png')
              .pipe($.spritesmith({
                  imgName: '../images/sprite.png',
                  cssName: '_sprite.scss'
              }));

  icons.img.pipe(gulp.dest('assets/images/'));
  icons.css.pipe(gulp.dest('assets/styles/imports'));

  gulp.start('styles');
});

gulp.task('html', () => {
  return gulp.src(['assets/**/*.html']).pipe(gulp.dest('build'));
});

gulp.task('bower', () => {
  return gulp.src(bowerfiles('**/*.js', function (err) {}))
  .pipe($.concat('external.min.js'))
  .pipe($.uglify())
  .pipe(gulp.dest('build/scripts'));
});

gulp.task('extras', () => {
  return gulp.src(['assets/favicon.png']).pipe(gulp.dest('build'));
});


gulp.task('clean', del.bind(null, ['build']));

gulp.task('serve', ['html', 'styles', 'scripts', 'fonts', 'images', 'bower', 'extras'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['build'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'assets/*.html',
    'assets/images/**/*',
    'build/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('assets/images/icos/*.png', ['sprites']);
  gulp.watch('assets/styles/**/*.scss', ['styles']);
  gulp.watch('assets/scripts/**/*.js', ['scripts']);
  gulp.watch('assets/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('assets/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('assets/styles'));

  gulp.src('assets/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('assets'));
});

gulp.task('build', ['html', 'images', 'fonts', 'bower', 'extras'], () => {
  return gulp.src('build/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('serve');
});