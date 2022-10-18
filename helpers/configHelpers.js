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
 * takes two (partial) configs and compares if a key was set to a non-undefined falsy value in the custom configuration

 * @param {object} defaultConfig default configuration in current environment
 * @param {object} customConfig custom configuration from project in current environment
 */
function deleteRemovedKeys(defaultConfig, customConfig) {
  if (customConfig) {
    Object.keys(defaultConfig).forEach((key) => {
      const isUnset = customConfig[key] !== undefined && !customConfig[key];
      if (isUnset) {
        delete defaultConfig[key];
        delete customConfig[key];
      }
    });
  }
}

/**
 * takes two (partial) webpack plugin configs and compares if a key was overwritten in custom config to then merge the otions to one plugin initialization

 * @param {object} defaultConfig default configuration in current environment
 * @param {object} customConfig custom configuration from project in current environment
 * @returns {object, object} Default an Custom Configs with priority to custom config
 */
function mergeConfigPlugins(defaultConfig, customConfig) {
  let defaultConf = defaultConfig;
  let customConf = customConfig;

  if (customConf.plugins) {
    defaultConf.plugins =
      defaultConf.plugins.map((plugin) => {
        const customPlugin = customConf.plugins.find(
          (customPlugin) => customPlugin.constructor.name === plugin.constructor.name
        );
        if (customPlugin) {
          return Object.assign(plugin, customPlugin);
        }
        return plugin;
      })

      delete customConf.plugins;
  }
  return {defaultConf, customConf};
}

function getOutputPath(environment) {
  return (
    (hasOwnConfig() &&
      getCustomWebpackConfiguration()(environment, argv).output &&
      getCustomWebpackConfiguration()(environment, argv).output.path) ||
    buildPath
  );
}

function buildCombinedConfiguration(environment) {
  const defaultConfiguration = require(`../config/webpack.${environment}`);
  if (!hasOwnConfig()) {
    return defaultConfiguration;
  }
  const customConfiguration = getCustomWebpackConfiguration();
  return combineConfigurations(defaultConfiguration, customConfiguration);
}

function combineConfigurations(defaultConfiguration, customConfiguration) {
  return function (env, args) {
    const defaultConf = defaultConfiguration(env, args);
    const customConf = customConfiguration(env, args);

    // Remove the entry points if they are set to non-undefined falsy values in the custom configuration
    deleteRemovedKeys(defaultConf.entry, customConf.entry);

    // If a plugin is defined in custom config that is already defined in common-config we will merge the options to one plugin initialization
    const cleanedPluginsConfigs  = mergeConfigPlugins(defaultConf, customConf);

    const mergedConfig =  mergeWithRules({
      module: {
        rules: {
          test: CustomizeRule.Match,
          use: {
            loader: "match",
            options: "replace"
          }
        }
      }
    })(cleanedPluginsConfigs.defaultConf, cleanedPluginsConfigs.customConf);
    return mergedConfig;
  };

}

module.exports = {
  buildCombinedConfiguration,
  combineConfigurations,
  getOutputPath,
};
