#!/usr/bin/env node

// Code taken from https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/scripts/build.js

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const merge = require('webpack-merge');

const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const clearConsole = require('react-dev-utils/clearConsole');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

const isInteractive = process.stdout.isTTY;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const buildPath = './Resources/Public/Dist';

const script = process.argv[2];
const argv = require('minimist')(process.argv.slice(3));

const hasOwnConfig = fs.existsSync(path.resolve(process.cwd(), 'webpack.js'));
const customConfiguration = hasOwnConfig ? require(path.resolve(process.cwd(), 'webpack.js')) : null;

switch (script) {
  case 'dev':
    processBuild(script);
    break;
  case 'prod':
    process.env.BABEL_ENV = 'production';
    process.env.NODE_ENV = 'production';

    processBuild(script);
    break;
  case 'watch':
    processWatch('dev');
    break;
  case 'test':
    processTest();
    break;
  case 'test-watch':
    processTestWatch();
    break;
  default:
    console.error(`Unknown environment "${script}", expected "dev", "prod" or "test / test-watch`);
    process.exit(1);
}

function processBuild(environment) {
  const webpackBuildPath = hasOwnConfig
    && customConfiguration(environment, argv).output
    && customConfiguration(environment, argv).output.path
    || buildPath;

  measureFileSizesBeforeBuild(webpackBuildPath)
    .then(previousFileSizes => {
      // Remove all content but keep the directory so that
      // if you're in it, you don't end up in Trash
      fs.emptyDirSync(webpackBuildPath);

      // Start the webpack build
      return build(environment, previousFileSizes);
    })
    .then(
      ({stats, previousFileSizes, warnings}) => {
        if (warnings.length) {
          console.log(chalk.yellow('Compiled with warnings.\n'));
          console.log(warnings.join('\n\n'));
          console.log(
            '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.'
          );
          console.log(
            'To ignore, add ' +
            chalk.cyan('// eslint-disable-next-line') +
            ' to the line before.\n'
          );
        } else {
          console.log(chalk.green('Compiled successfully.\n'));
        }

        console.log('File sizes after gzip:\n');
        printFileSizesAfterBuild(
          stats,
          previousFileSizes,
          webpackBuildPath,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE
        );
        console.log();
      },
      err => {
        console.log(chalk.red('Failed to compile.\n'));
        printBuildError(err);
        process.exit(1);
      }
    )
    .catch(err => {
      if (err && err.message) {
        console.log(err.message);
      }
      process.exit(1);
    });
}

function buildCustomConfiguration(defaultConfig, customConfig) {
  return function(env, args) {
    return merge({
      customizeObject(a,b,key) {
        if (key === 'entry') {
          Object.keys(a).forEach(key => {
            if (b[key] !== undefined && !b[key]) {
              delete a[key];
              delete b[key];
            }
          });
        }

        return undefined;
      }
    })(defaultConfig(env, args), customConfig(env, args));
  }
}

function build(environment, previousFileSizes) {
  const webpack = require('webpack');
  const defaultConfiguration = require(`../webpack.${environment}`);
  const combinedConfiguration = hasOwnConfig ? buildCustomConfiguration(defaultConfiguration, customConfiguration) : defaultConfiguration;

  const compiler = webpack(combinedConfiguration(environment, argv));

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      const messages = formatWebpackMessages(
        stats.toJson({all: false, warnings: true, errors: true})
      );

      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }

      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
            'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      });
    });
  });
}

// Code taken from https://github.com/neos/neos-ui/blob/master/packages/neos-ui-extensibility/scripts/watch.js

function processWatch(environment) {
  const webpack = require('webpack');

  const defaultConfiguration = require(`../webpack.${environment}`);
  const combinedConfiguration = hasOwnConfig ? buildCustomConfiguration(defaultConfiguration, customConfiguration) : defaultConfiguration;

  const compiler = webpack(combinedConfiguration(environment, argv));

  compiler.plugin('invalid', () => {
    if (isInteractive) {
      clearConsole();
    }
    console.log('Compiling...');
  });

  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.
  compiler.plugin('done', (stats) => {
    if (isInteractive) {
      clearConsole();
    }

    // We have switched off the default Webpack output in WebpackDevServer
    // options so we are going to "massage" the warnings and errors and present
    // them in a readable focused way.
    const messages = formatWebpackMessages(stats.toJson({}, true));
    const isSuccessful = !messages.errors.length && !messages.warnings.length;

    if (isSuccessful) {
      console.log(chalk.green('Compiled successfully! - ' + new Date().toISOString()));
    }


    // If errors exist, only show errors.
    if (messages.errors.length) {
      console.log(chalk.red('Failed to compile.'));
      console.log();
      messages.errors.forEach(message => {
        console.log(message);
        console.log();
      });
      return;
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.'));
      console.log();
      messages.warnings.forEach(message => {
        console.log(message);
        console.log();
      });
      // Teach some ESLint tricks.
      console.log('You may use special comments to disable some warnings.');
      console.log('Use ' + chalk.yellow('// eslint-disable-next-line') + ' to ignore the next line.');
      console.log('Use ' + chalk.yellow('/* eslint-disable */') + ' to ignore all warnings in a file.');
    }
  });


  compiler.watch({}, (err, stats) => {
  });
}


function processTest() {
  runTest();
}

function processTestWatch() {
  runTest({ watch: true });
}

function runTest({ watch } = {}) {
  const createMochaWebpack = require('mocha-webpack');
  const testHelper = require('../helpers/testHelper');
  const coverageHelper = require('../helpers/coverageHelper');
  const combinedReporter = require('../helpers/combinedTestReporter');

  const mochaWebpack = createMochaWebpack();

  const reportDirectory = path.resolve(process.cwd(), './Resources/Private/Javascript/coverage');

  const basePackagePathAbsolute = () =>  path.resolve(process.cwd(), `../${argv.basePackage}`);

  testHelper.prepareTestEnvironment();
  if (!watch) {
    coverageHelper.prepareCoverageReporter();
  }

  mochaWebpack.cwd(process.cwd());
  mochaWebpack.webpackConfig(require('../webpack.test')('development', argv));
  mochaWebpack.addEntry(path.resolve(basePackagePathAbsolute(), './Resources/Private/Javascript/') + '/**/*.test.js');

  mochaWebpack.reporter(combinedReporter(reportDirectory));

  if (watch) {
    mochaWebpack.watch();
  } else {
    const runner = mochaWebpack.run();

    runner.then((errors) => {
      coverageHelper.generateCoverageReport(reportDirectory);

      if(!errors) {
        console.log(chalk.green('Tests completed'));
      } else {
        console.error(chalk.red(`${errors} ${errors === 1 ? 'Test' : 'Tests'} failed`));
      }
    });
  }
}
