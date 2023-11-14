var gulp = require('gulp');
var concat = require('gulp-concat');
var terser = require('gulp-terser');
var jeditor = require("gulp-json-editor");
var del = require('del');
var zip = require('gulp-zip');

gulp.task('backgroundoptions',function(){
        return gulp.src(['scripts/background.js', 'scripts/options.js'])
        .pipe(terser())
        .pipe(gulp.dest('dist/scripts'));
});


gulp.task('media',function(){
        return gulp.src(['views/*.html', 'css/*.css', 'images/*.*','LICENSE'],{base: './'})
        .pipe(gulp.dest('dist'));
});


gulp.task('contentscripts',function(){
        return gulp.src(["scripts/lodash.core.js","scripts/moment.min.js","scripts/pikaday.js","scripts/interest.js","scripts/transaction-module.js",
    "scripts/global.js","scripts/main.js"])
        .pipe(concat('contentscripts.js'))
        .pipe(terser())
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('build',gulp.parallel('backgroundoptions','contentscripts','media', () => {
        return  gulp.src("./manifest.json")
                .pipe(jeditor(function(json) {
                        json.content_scripts[0].js = ["scripts/contentscripts.js"];
                        //delete json.key;
                        return json; // must return JSON object. 
                }))
                .pipe(gulp.dest("./dist"));

}));


gulp.task('package',gulp.series('build', () => {
    return gulp.src('dist/**')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('dist'));
}));

gulp.task('clean', () => del(['dist/**']));
