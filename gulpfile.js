const gulp = require('gulp');
const concat = require('gulp-concat-css');
const plumber = require('gulp-plumber');
const del = require('del');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mediaquery = require('postcss-combine-media-query');
const cssnano = require('cssnano');
const htmlMinify = require('html-minifier');

// Инициализация сервера
function serve() {
  browserSync.init({
    server: {
      baseDir: './dist',
    },
  });
}

// Сборка HTML
function html() {
  const options = {
    removeComments: true, // Удалит комментарии
    removeRedundantAttributes: true, // Удалит атрибут, если его значение дублирует значение по умолчанию
    removeScriptTypeAttributes: true, // Удалит type="text/javascript" из тега script
    removeStyleLinkTypeAttributes: true, // Удалит type="text/css" из тегов style и link
    sortClassName: true, // Отсортирует классы по частоте применения
    useShortDoctype: true, // Заменит doctype запись на короткую согласно документации HTML5
    collapseWhitespace: true, // Удалит лишние пробелы
    minifyCSS: true, // Минифицирует встроенный css-код
    keepClosingSlash: true, // Закроет все одиночные элементы слешем
  };
  return (
    gulp
      .src('src/**/*.html') // Что собирать
      .pipe(plumber()) // Надежнее собирает код
      // Настройки для постпроцессинга
      .on('data', function (file) {
        const buferFile = Buffer.from(
          htmlMinify.minify(file.contents.toString(), options)
        );
        return (file.contents = buferFile);
      })
      .pipe(gulp.dest('dist/')) // Куда собирать
      .pipe(browserSync.reload({ stream: true }))
  ); // Сервер перезагружает страницу браузера
}

// Сборка CSS
function css() {
  // Плагины для поспроцессинга
  const plugins = [
    autoprefixer(), // Добавит вендорные префиксы
    mediaquery(), // Склеит все медиазапросы в итоговом бандле
    cssnano(), // Минифицирует css-бандл
  ];
  return gulp
    .src('src/blocks/**/*.css') // Что собирать
    .pipe(plumber()) // Надежнее собирает код
    .pipe(concat('bundle.css')) // Склеивает все файлы в один бандл
    .pipe(postcss(plugins)) // Постпроцессинг CSS с помощью перечисленных ранее плагинов
    .pipe(gulp.dest('dist/')) // Куда собирать
    .pipe(browserSync.reload({ stream: true })); // Сервер перезагружает страницу браузера
}

// Сборка изображений
function images() {
  return gulp
    .src('src/images/**/*.{jpg,png,svg,gif,ico,webp,avif}') // Что собирать
    .pipe(gulp.dest('dist/images')) // Куда собирать
    .pipe(browserSync.reload({ stream: true })); // Сервер перезагружает страницу браузера
}

// Чистка dist
function clean() {
  return del('dist');
}

// Полная сборка
const build = gulp.series(
  // Поочередная сборка
  clean, // Чистка dist
  gulp.parallel(
    // Параллельная сборка
    html,
    css,
    images
  )
);

// Следить за изменениями в /src
function watchFiles() {
  gulp.watch(['src/**/*.html'], html);
  gulp.watch(['src/blocks/**/*.css'], css);
  gulp.watch(['src/images/**/*.{jpg,png,svg,gif,ico,webp,avif}'], images);
}
// При вызове, если заметит изменения в /src, параллельно будет запускать сборку
const watchapp = gulp.parallel(build, watchFiles, serve);

// Команды на экспорт
exports.clean = clean; // Чистка dist
exports.images = images; // Сборка изображений
exports.css = css; // Сборка css
exports.html = html; // Сборка html
exports.build = build; // Полная сборка с предварительной чисткой
exports.watchapp = watchapp; // Автосборка после изменений

// По умолчанию, при вызове команды gulp в терминале,
// будет запускаться сервер с отслеживанием изменений
exports.default = watchapp;
