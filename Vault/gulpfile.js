/// <binding ProjectOpened='watch-app, watch-tests' />

const gulp = require('gulp');
const spawn = require('child_process').spawn;

const webpackCmd = `webpack${process.platform === 'win32' ? '.cmd' : ''}`;

const buildAppArgs = ['--watch', '--config=webpack.config.app', '--mode=development'];
const buildTestsArgs = ['--watch', '--config=webpack.config.tests', '--mode=development'];

gulp.task('watch-app', done => spawn(webpackCmd, buildAppArgs, { stdio: 'inherit' }));
gulp.task('watch-tests', done => spawn(webpackCmd, buildTestsArgs, { stdio: 'inherit' }));
