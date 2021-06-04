const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

const argv = require('minimist')(process.argv.slice(3));

function processTest(options) {
  runTest(options);
}

function runTest({ watch = false } = {}) {
  const createMochaWebpack = require('mochapack').default;
  const testHelper = require('../helpers/testHelper');
  const coverageHelper = require('../helpers/coverageHelper');
  const combinedReporter = require('../helpers/combinedTestReporter');
  const reportDirectory = path.resolve(
    process.cwd(),
    './Resources/Private/Javascript/coverage'
  );
  const basePackageName = process.env['BASE_PACKAGE_NAME'];
  const basePackagePathAbsolute = () =>
    path.resolve(process.cwd(), `../${basePackageName}`);

  testHelper.prepareTestEnvironment();
  if (!watch) {
    coverageHelper.prepareCoverageReporter();
  }

  const mochaWebpack = createMochaWebpack({
    mochapack: {
      interactive: watch,
      clearTerminal: watch,
    },
    webpack: {
      config: require('../webpack.test')('production', argv),
      mode: 'production',
    },
    mocha: {
      constructor: {
        reporter: combinedReporter(reportDirectory),
        ui: 'bdd',
      },
      cli: {
        files: [],
      },
    },
  });

  mochaWebpack.addEntry(
    path.resolve(
      basePackagePathAbsolute(),
      './Resources/Private/{Javascript,Components/**/__Tests__}/'
    ) + '/**/*.test.js'
  );

  if (watch) {
    mochaWebpack.watch();
  } else {
    const runner = mochaWebpack.run();

    runner.then((errors) => {
      coverageHelper.generateCoverageReport(reportDirectory);

      if (!errors) {
        console.log(chalk.green('Tests completed'));
      } else {
        console.error(
          chalk.red(`${errors} ${errors === 1 ? 'Test' : 'Tests'} failed`)
        );
      }
    });
  }
}

module.exports = processTest;
