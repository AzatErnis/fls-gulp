const { src, dest } = require('gulp')
        gulp = require('gulp')
        browsersync = require('browser-sync').create()
        fileinclude = require('gulp-file-include')
        del = require('del')
        scss = require('gulp-sass')
        autoprefixer = require('gulp-autoprefixer')
        group_media = require('gulp-group-css-media-queries')
        clean_CSS = require('gulp-clean-css')
        rename = require("gulp-rename")
        uglify = require('gulp-uglify')
        babel = require('gulp-babel')
        imagemin = require('gulp-imagemin')
        webp = require('gulp-webp')
        webphtml = require('gulp-webp-html')
        // webpcss = require("gulp-webpcss")
        svgSprite = require('gulp-svg-sprite')
        ttf2woff = require('gulp-ttf2woff')
        ttf2woff2 = require('gulp-ttf2woff2')
        fonter = require('gulp-fonter')


let project_folder = require("path").basename(__dirname)
let source_folder = '#src'
let fs = require('fs')

let path = {
  build: {
    html: `${project_folder}/`,
    css: `${project_folder}/css/`,
    js: `${project_folder}/js/`,
    img: `${project_folder}/img/`,
    fonts: `${project_folder}/fonts/`,
  },
  src: {
    html: [`${source_folder}/*.html`, `!${source_folder}/_*.html`],
    css: `${source_folder}/scss/style.scss`,
    js: `${source_folder}/js/script.js`,
    img: `${source_folder}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
    fonts: `${source_folder}/fonts/*.ttf`,
  },
  watch: {
    html: `${source_folder}/**/*.html`,
    css: `${source_folder}/scss/**/*.scss`,
    js: `${source_folder}/js/**/*.js`,
    img: `${source_folder}/img/**/*.{jpg,png,svg,gif,ico,webp}`
  },
  clean: `./${project_folder}/`
}

const browserSync = params => {
  browsersync.init({
    server: {
      baseDir: `./${project_folder}/`
    },
    port: 3000,
    notify: false
  })
}

const html = () => src(path.src.html)
  .pipe(fileinclude())
  .pipe(webphtml())
  .pipe(dest(path.build.html))
  .pipe(browsersync.stream())

const css = () => src(path.src.css)
  .pipe(scss({ outputStyle: 'expanded' }))
  .pipe(group_media())
  .pipe(autoprefixer({
    overrideBrowserslist: ['last 5 version'],
    cascade: true
  }))
  // .pipe(webpcss({webpClass: '.webp', noWebpClass: '.no-webp'}))
  .pipe(dest(path.build.css))
  .pipe(clean_CSS())
  .pipe(rename({ extname: '.min.css' }))
  .pipe(dest(path.build.css))
  .pipe(browsersync.stream())

const js = () => src(path.src.js)
  .pipe(fileinclude())
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(dest(path.build.js))
  .pipe(uglify())
  .pipe(rename({ extname: '.min.js' }))
  .pipe(dest(path.build.js))
  .pipe(browsersync.stream())

const img = () => src(path.src.img)
  .pipe(webp({ quality: 70 }))
  .pipe(dest(path.build.img))
  .pipe(src(path.src.img))
  .pipe(imagemin({
    interlaced: true,
    progressive: true,
    optimizationLevel: 3,
    svgoPlugins: [{ removeViewBox: false }]
  }))
  .pipe(dest(path.build.img))
  .pipe(browsersync.stream())

const fonts = () => {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', () => gulp.src([`${source_folder}/fonts/*.otf`])
  .pipe(fonter({ formats: ['ttf']}))
  .pipe(dest(`${source_folder}/fonts/`))
)

gulp.task('svgSprite', () => gulp.src([`${source_folder}/iconsprite/*.svg`])
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: "../icons/icons.svg", //sprite file name
        example: true
      }
    }
  }))
  .pipe(dest(path.build.img))
)

const fontStyle = (params) => {
  let file_content = fs.readFileSync(`${source_folder}/scss/fonts.scss`)
  if (file_content == '') {
    fs.writeFile(`${source_folder}/scss/fonts.scss`, '', cb)
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.')
          fontname = fontname[0]
          if (c_fontname != fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname
        }
      }
    })
  }
}

function cb() {

}

const watchFiles = params => {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], img)
}

const clean = params => del(path.clean)

const build = gulp.series(clean, gulp.parallel(html, css, js, img, fonts), fontStyle)
const watch = gulp.parallel(build, watchFiles, browserSync)




exports.watch = watch
exports.html = html
exports.css = css
exports.js = js
exports.img = img
exports.fonts = fonts
exports.fontStyle = fontStyle
exports.build = build
exports.default = watch