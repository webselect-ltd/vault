/// <binding ProjectOpened='app, tests' />

const gulp = require('gulp');
const spawn = require('child_process').spawn;

const webpackCmd = `webpack${process.platform === 'win32' ? '.cmd' : ''}`;

const buildAppArgs = ['--watch', '--config=webpack.config.app', '--mode=development'];
const buildTestsArgs = ['--watch', '--config=webpack.config.tests', '--mode=development'];

gulp.task('app', done => spawn(webpackCmd, buildAppArgs, { stdio: 'inherit' }));
gulp.task('tests', done => spawn(webpackCmd, buildTestsArgs, { stdio: 'inherit' }));

gulp.task('coverage', done => spawn('npm.cmd', ['run', 'coverage'], { stdio: 'inherit' }));
