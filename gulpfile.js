(function (require, process) {
    'use strict';

    var gulp = require('gulp'),
        argv = require('yargs').argv,
        chalk = require('chalk'),
        changed = require('gulp-changed'),
        connect = require('gulp-connect'),
        cssAutoprefixer = require('gulp-autoprefixer'),
        csslint = require('gulp-csslint'),
        del = require('del'),
        gulpif = require('gulp-if'),
        gutil = require('gulp-util'),
        historyApiFallback = require('connect-history-api-fallback'),
        logSymbols = require('log-symbols'),
        notify = require('gulp-notify'),
        rename = require('gulp-rename'),
        runSequence = require('run-sequence'),
        sass = require('gulp-sass'),
        stringLength = require('string-length'),
        table = require('text-table'),
        template = require('gulp-template'),
        vinylPaths = require('vinyl-paths'),
        watch = require('gulp-watch'),

        config = require('./config.js'),
        env = process.env.NODE_ENV || 'dev',
        cacheBuster = Date.now();

    /**
     * Lints all of the scss files compiles them into CSS and moves them
     * into the build directory.
     *
     * * NOTE: Works best if you only have one .scss file and everything else
     *         is imported from it.
     */
    gulp.task('buildStyles', function () {
        var customCssReporter = function (file) {
            var errCount = 0,
                warnCount = 0,
                msgTable,
                countTable = [];

            var pluralize = function (str, count) {
                return str + (count === 1 ? '' : 's');
            };

            if (file.csslint.success) {
                return false;
            }

            // Log out the file path.
            gutil.log(
                '\n' +
                chalk.underline(file.path)
            );

            // Format each error message.
            msgTable = table(file.csslint.results.map(function (res) {
                var row = [''],
                    isError = res.error.type === 'error';

                if (isError) {
                    errCount++;

                    res.error.message = chalk.red(res.error.message);
                } else {
                    warnCount++;

                    res.error.message = chalk.yellow(res.error.message);
                }

                if (res.error.line && res.error.col) {
                    row.push(chalk.gray('line ' + res.error.line));
                    row.push(chalk.gray('col ' + res.error.col));
                    row.push(res.error.message);
                } else {
                    row.push('');
                    row.push('');
                    row.push(res.error.message);
                }

                if (file.csslint.options.verbose) {
                    row[row.length - 1] += ' (' + res.error.rule.id + ')';
                }

                return row;
            }), {
                stringLength: stringLength
            });

            // Format the warning and error count tables.
            if (errCount > 0) {
                countTable.push([
                    '',
                    logSymbols.error,
                    errCount + pluralize(' error', errCount)
                ]);
            }

            if (warnCount > 0) {
                countTable.push([
                    '',
                    logSymbols.warning,
                    warnCount + pluralize(' warning', warnCount)
                ]);
            }

            // Log out the error message and count tables.
            gutil.log(msgTable);
            gutil.log('\n' + table(countTable));
        };

        return gulp.src(config.appFiles.styles)
            .pipe(changed(config.buildDir))
            .pipe(sass().on('error', sass.logError))
            .pipe(csslint('.csslintrc'))
            .pipe(csslint.reporter(customCssReporter))
            .pipe(cssAutoprefixer(config.cssAutoPrefixerOptions))
            .pipe(gulp.dest(config.buildDir))
            .pipe(connect.reload());
    });

    /**
     * Cleans the build and compile directories.
     */
    gulp.task('clean', function () {
        return gulp.src([config.buildDir, config.compileDir], {read: false})
            .pipe(vinylPaths(del));
    });

    /**
     * Start the development server on port 9000. Runs from the `bin/` folder if
     * it exists.
     */
    gulp.task('connect', function () {
        var port = parseInt(argv.port) || 9000,
            host = argv.host || 'localhost';
        connect.server({
            root: ['bin', 'build'],
            port: port,
            livereload: true,
            host: host,
            middleware: function () {
                return [historyApiFallback];
            }
        });
        gulp.src(config.appFiles.index)
            .pipe(notify('Server running on http://' + host + ':' + port));
    });

    /**
     * Find all of the .js and .css files that need to be included in the
     * index.html file.
     */
    gulp.task('index', function () {
        var styles = config.index.styles;

        return gulp.src(config.appFiles.index)
            .pipe(template({
                styles: styles
            }))
            .pipe(rename(config.index.name))
            .pipe(gulp.dest(config.buildDir))
            .pipe(connect.reload());
    });

    /**
     * Watch the app files for any changes and perform the necessary actions
     * when a change does occur.
     */
    gulp.task('watch', function () {
        watch(config.appFiles.delta.styles, function () {
            gulp.start(['buildStyles']);
        });
        watch(config.appFiles.index, function () {
            gulp.start(['index']);
        });
        watch(['./config.js'], function () {
            delete require.cache[require.resolve('./config.js')];
            config = require('./config.js');
            gulp.start(['index']);
        });
    });

    gulp.task('build', function (callback) {
        // Ensure clean is run and finished before everything else.
        runSequence(
            'clean',
            ['buildStyles'],
            'index',
            'watch',
            'connect',
            callback
        );
    });

    gulp.task('server', ['connect']);

    gulp.task('default', ['build']);
}(require, process));
