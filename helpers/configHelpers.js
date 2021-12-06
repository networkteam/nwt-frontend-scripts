const fs = require('fs');
const path = require('path');
const { mergeWithCustomize } = require('webpack-merge');

const argv = require('minimist')(process.argv.slice(3));

const buildPath = './Resources/Public/Dist';

const hasOwnConfig = () =>
  fs.existsSync(path.resolve(process.cwd(), 'webpack.js'));

function getCustomWebpackConfiguration() {
  return hasOwnConfig()
    ? require(path.resolve(process.cwd(), 'webpack.js'))
    : null;
}

function getOutputPath(environment) {
  return (
    (hasOwnConfig() &&
      getCustomWebpackConfiguration()(environment, argv).output &&
      getCustomWebpackConfiguration()(environment, argv).output.path) ||
    buildPath
  );
}

function buildCustomConfiguration(environment) {
  const defaultConfiguration = require(`../config/webpack.${environment}`);
  if (!hasOwnConfig()) {
    return defaultConfiguration;
  }
  const customConfig = getCustomWebpackConfiguration();

  return function (env, args) {
    return mergeWithRules({
      module: {
        rules : {
          test: "match",
          use: {
            loader: "match",
            options: "replace"
          }
        }
      },
      customizeObject(a, b, key) {
        if (key === 'entry') {
          Object.keys(a).forEach((key) => {
            if (b[key] !== undefined && !b[key]) {
              delete a[key];
              delete b[key];
            }
          });
        }

        return undefined;
      },
    })(defaultConfiguration(env, args), customConfig(env, args));
  };
}

module.exports = {
  buildCustomConfiguration,
  getOutputPath,
};
