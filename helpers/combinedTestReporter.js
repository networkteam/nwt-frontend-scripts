

/**
 * Mocha does not support mutliple reporters by default
 *
 * @param {*} reportDirectory the directory for the report files
 * @returns
 */

module.exports = function(reportDirectory) {
  return function(runner) {
    const Spec = require('mocha/lib/reporters/spec');

    if (process.env.CI) {
      const JUnit = require('mocha-junit-reporter');

      new JUnit(runner, {
        reporterOptions: {
          mochaFile: `${reportDirectory}/junit.xml`
        }
      })
    }

    new Spec(runner);
  }
}