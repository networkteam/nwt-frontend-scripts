const fs = require('fs-extra');
const chalk = require('chalk');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const configHelpers = require('../helpers/configHelpers');
const { verifyTypeScriptSetup } = require('../helpers/typescript');

const argv = require('minimist')(process.argv.slice(3));
const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;
// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

async function processBuild(environment) {
  await verifyTypeScriptSetup();
  const webpackBuildPath = configHelpers.getOutputPath();

  measureFileSizesBeforeBuild(webpackBuildPath)
    .then((previousFileSizes) => {
      // Remove all content but keep the directory so that
      // if you're in it, you don't end up in Trash
      fs.emptyDirSync(webpackBuildPath);

      // Start the webpack build
      return build(environment, previousFileSizes);
    })
    .then(
      ({ stats, previousFileSizes, warnings }) => {
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
      (err) => {
        console.log(chalk.red('Failed to compile.\n'));
        printBuildError(err);
        throw new Error('Failed to compile.');
      }
    )
    .catch((err) => {
      if (err && err.message) {
        console.log(err.message);
      }
      throw new Error('Failed to compile.');
    });
}

function build(environment, previousFileSizes) {
  const webpack = require('webpack');
  const combinedConfiguration =
    configHelpers.buildCustomConfiguration(environment);

  const compiler = webpack(combinedConfiguration(environment, argv));

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      const messages = formatWebpackMessages(
        stats.toJson({ all: false, warnings: true, errors: true })
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

module.exports = processBuild;
