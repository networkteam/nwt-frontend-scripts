const Instrumenter = require('istanbul-lib-instrument');
const convert = require('convert-source-map');
const sourceMapSupport = require('source-map-support');
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');
const Module = require('module');
const glob = require('glob');
const path = require('path');
const istanbulCoverage = require('istanbul-lib-coverage');
const istanbulApi = require('istanbul-api');

// Adds support for istanbulJS Coverage Reports to mocha tests

module.exports = {
  // The generator needs to run in a callback of the tests
  generateCoverageReport: function(targetDirectory) {
    const reporters = ['text', 'html'];
    const mochaCoverage = global.__coverage__ || {};
    const coverageMap = istanbulCoverage.createCoverageMap();

    if (!targetDirectory) {
      console.log('No target directory set to save corverage');
      return;
    }

    coverageMap.merge(mochaCoverage);

    var reporter = istanbulApi.createReporter(istanbulApi.config.loadObject(istanbulApi.config.defaultConfig().reporting, {
      reporting: {
        dir: targetDirectory
      }
    }));
    reporter.addAll(reporters);

    reporter.write(coverageMap, {});
  },

  // The instrumenter needs to run before the actual tests
  prepareCoverageReporter: function() {
    sourceMapSupport.install({
      environment: 'node',
      hookRequire: true
    });


    var include = 'Resources/Private/Javascript/**/*.js';
    var instrumentSources = glob.sync(include).map(file => path.join(process.cwd(), file));
    var codeCache = {};

    var instrumenter = Instrumenter.createInstrumenter({
      compact: false,
      esModules: true,
      produceSourceMap: true,
    });

    function shouldInstrument(filename) {
      return instrumentSources.indexOf(filename) >= 0;
    }

    function instrument(code, filename) {
      const code2 = instrumenter.instrumentSync(code, filename);
      const outputSourceMap = new SourceMapConsumer(instrumenter.lastSourceMap());
      const combinedSourceMap = SourceMapGenerator.fromSourceMap(outputSourceMap);

      const inputSourceMap = convert.fromSource(code);
      if (inputSourceMap) {
        combinedSourceMap.applySourceMap(new SourceMapConsumer(inputSourceMap.toObject()), filename);
      }

      return code2.replace(/\/\/# sourceMappingURL=.*$/, '') + convert.fromObject(combinedSourceMap).toComment();
    }

    const _compile = Module.prototype._compile;
    Module.prototype._compile = function (code, fileName) {
      if (shouldInstrument(fileName)) {
        if (codeCache[fileName]) {
          code = codeCache[fileName];
        } else {
          code = codeCache[fileName] = instrument(code, fileName);
        }
      }
      return _compile.call(this, code, fileName);
    };
  }
}
