const paths = require('./paths');
const semver = require('semver');

const hasJsxRuntime = (() => {
  try {
    require.resolve('react/jsx-runtime', { paths: [paths.misc.appPath] }); //eslint-disable-line node/no-missing-require
    return true;
  } catch (e) {
    return false;
  }
})();

const generateDefaultOptions = (ts) => ({
  // These are suggested values and will be set when not present in the
  // tsconfig.json
  // 'parsedValue' matches the output value from ts.parseJsonConfigFileContent()
  target: {
    parsedValue: ts.ScriptTarget.ES5,
    suggested: 'es5',
  },
  lib: { suggested: ['dom', 'dom.iterable', 'esnext'] },
  allowJs: { suggested: true },
  skipLibCheck: { suggested: true },
  esModuleInterop: { suggested: true },
  allowSyntheticDefaultImports: { suggested: true },
  strict: { suggested: true },
  forceConsistentCasingInFileNames: { suggested: true },
  noFallthroughCasesInSwitch: { suggested: true },

  // These values are required and cannot be changed by the user
  // Keep this in sync with the webpack config
  module: {
    parsedValue: ts.ModuleKind.ESNext,
    value: 'esnext',
    reason: 'for import() and import/export',
  },
  moduleResolution: {
    parsedValue: ts.ModuleResolutionKind.NodeJs,
    value: 'node',
    reason: 'to match webpack resolution',
  },
  resolveJsonModule: { value: true, reason: 'to match webpack loader' },
  isolatedModules: { value: true, reason: 'implementation limitation' },
  noEmit: { value: true },
  jsx: {
    parsedValue:
      hasJsxRuntime && semver.gte(ts.version, '4.1.0-beta')
        ? ts.JsxEmit.ReactJSX
        : ts.JsxEmit.React,
    value:
      hasJsxRuntime && semver.gte(ts.version, '4.1.0-beta')
        ? 'react-jsx'
        : 'react',
    reason: 'to support the new JSX transform in React 17',
  },
  paths: { value: undefined, reason: 'aliased imports are not supported' },
});
module.exports = generateDefaultOptions;
