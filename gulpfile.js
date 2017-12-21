const gulp = require('gulp'),
    bump = require('gulp-bump'),
    git = require('gulp-git'),
    filter = require('gulp-filter'),
    tag_version = require('gulp-tag-version'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream'),
    through = require('through2'),
    del = require('del'),
    mocha = require('gulp-mocha'),
    fs = require('fs'),
    exec = require('child_process').exec,
    watch = require('gulp-watch'),
    resolve = require('rollup-plugin-node-resolve'),
    babili = require("gulp-babili");

//function for taking streams and returning streams;
let chain = (cb) => {
    return through.obj(function(chunk, enc, next) {
        let push = this.push.bind(this);
        cb(chunk, enc).pipe(through.obj((chunk, enc, done) => {
            push(chunk);
            done();
            next();
        }))
    });
};

let getFiles = (dir, files_) => {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
};

let excludePaths = getFiles(process.cwd() + '/src');

// extension for rollup, for executing any file in directory from src
let rollupStream = (srcDir) => chain((chunk) => {
    let dir = srcDir[srcDir.length - 1] === '/' ? srcDir.substring(0, srcDir.length - 1) : srcDir,
        baseDir = process.cwd() + dir + '/',
        {path} = chunk,
        moduleName = path.replace(baseDir, ''),
        excluded = excludePaths.filter(file => file !== path);
    return rollup({
        input:      path,
        format:     'cjs',
        name: moduleName,
        external:   excluded
    }).pipe(source(moduleName));
});

gulp.task('clean', () => {
    return del([
        './dist',
        './examples/**/dist',
        './target'
    ]);
});

gulp.task('rollup', ['clean'], () => {
    return gulp.src('./src/**/*.js', {read: false})
        .pipe(rollupStream('/src/'))
        .pipe(gulp.dest('./dist'));
});

let sampleRollup = (name, file = 'index', format = 'umd') => {
    let roll = rollup({
        input:      `./examples/${name}/src/${file}.js`,
        format:     format,
        name: file,
        plugins:    [
            resolve({
                jsnext:               true,
                browser:              true,
                main:                 true,
                customResolveOptions: {
                    moduleDirectory: './src'
                }
            }),
        ]
    })
    roll.on('error', (err) => console.log(err));
    return roll.pipe(source(`./${file}.js`))
        .pipe(gulp.dest(`./examples/${name}/dist`));
}

let examples = () => {
    sampleRollup('service', 'index','cjs');
    sampleRollup('service', 'main','iife');
    sampleRollup('lazy', 'index','cjs');
    sampleRollup('lazy', 'main','iife');
    sampleRollup('lazy', 'sw','iife');
};
gulp.task('sampleRollup', examples);

gulp.task('watch', ['clean', 'rollup','sampleRollup'], () => {
    return watch('./examples/**/src/*.js', {ignoreInitial: true}, examples);
});


gulp.task('test', ['rollup', 'sampleRollup'], () => {
    return gulp.src([
        './test/**/*.js'
    ], {read: false}).pipe(mocha({reporter: 'list'}));

});

let inc = (importance) => gulp.src(['./package.json', './bower.json'])
// bump the version number in those files
    .pipe(bump({type: importance}))
    // save it back to filesystem
    .pipe(gulp.dest('./'))
    // commit the changed version number
    .pipe(git.commit('bumps package version'))

    // read only one file to get the version number
    .pipe(filter('package.json'))
    // **tag it in the repository**
    .pipe(tag_version());

gulp.task('pushTags', ['test', 'bump:patch'], (cb) => {
    exec('git push --tags', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('compress', () => gulp.src('examples/**/dist/*.js', {base: "./"})
    .pipe(babili({
        mangle: {
            keepClassNames: true
        }
    }))
    .pipe(gulp.dest(".")));

gulp.task('compressRequire', () => gulp.src('./node_modules/requirejs/require.js')
    .pipe(babili({
        mangle: {
            keepClassNames: true
        }
    }))
    .pipe(gulp.dest("./target")));

gulp.task('publish', ['pushTags'], (cb) => {
    exec('npm publish ./', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('bump:patch', () => inc('patch'));
gulp.task('bump:feature', () => inc('minor'));
gulp.task('bump:release', () => inc('major'));

gulp.task('default', ['test']);

