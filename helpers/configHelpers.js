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
 * merges plugins of customConfig in defaultConfig if they were also defined in defaultConfig then removes them from initialization array once, so that they are being initialized only once.

 * @param {object} defaultConfig default configuration in current environment
 * @param {object} customConfig custom configuration from project in current environment
 * @returns {object, object} Default an Custom Configs with priority to custom config
 */
function mergeConfigPlugins(defaultConfig, customConfig) {
  let defaultConf = defaultConfig;
  let customConf = customConfig;

  if (customConf.plugins) {
    defaultConf.plugins = defaultConf.plugins.map((plugin) => {
      // finds duplicated plugin in custom config
      const customPlugin = customConf.plugins.find(
        (customPlugin) => customPlugin.constructor.name === plugin.constructor.name
      );
      if (customPlugin) {
        const mergedPlugin = mergeDeep(plugin, customPlugin);
        // removes plugin from custom config so it is not initialized twice
        customConf.plugins.splice(customConf.plugins.indexOf(customPlugin), 1);
        return mergedPlugin
      }
      return plugin;
    });
  }
  return {defaultConf, customConf};
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * recursively merges two objects by keys

 * @param {object} target target object to merge into
 * @param {object} sources target object to merge from
 */

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {
          [key]: {}
        });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return mergeDeep(target, ...sources);
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
