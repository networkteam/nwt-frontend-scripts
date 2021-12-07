const fs = require('fs');
const path = require('path');
const { mergeWithRules, CustomizeRule } = require('webpack-merge');

const argv = require('minimist')(process.argv.slice(3));

const buildPath = './Resources/Public/Dist';

const hasOwnConfig = () =>
  fs.existsSync(path.resolve(process.cwd(), 'webpack.js'));

function getCustomWebpackConfiguration() {
  return hasOwnConfig()
    ? require(path.resolve(process.cwd(), 'webpack.js'))
    : null;
}
/**
 * takes two configs and compares their keys and values
 * currently supports entrypoints
 * @param {object} dc default configuration in current environment
 * @param {object} cc custom configuration from project in current environment
 * @returns {Array} Default and custom configuration for merging
 */
function checkForRemovedKeys(dc, cc) {
  if (cc.entry) {
    Object.keys(dc.entry).forEach((key) => {
      const isUnset = cc.entry[key] !== undefined && !cc.entry[key];
      if (isUnset) {
        delete dc.entry[key];
        delete cc.entry[key];
      }
    });
  }

  return [dc, cc]
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
    const [defaultConf, customConf] = checkForRemovedKeys(defaultConfiguration(env, args), customConfig(env, args));
    return mergeWithRules({
      module: {
        rules: {
          test: CustomizeRule.Match,
          use: {
            loader: "match",
            options: "replace"
          }
        }
      }
    })(defaultConf, customConf);
  };
}

module.exports = {
  buildCustomConfiguration,
  getOutputPath,
};
