const { merge } = require('webpack-merge');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const common = require('./webpack.common.js');

module.exports = function (env, args) {
  args.mode = 'development';
  return merge(common(env, args), {
    // CSS loaders need inline source maps to work correctly
    devtool: 'inline-source-map',
    plugins: [
      new LiveReloadPlugin({
        appendScriptTag: true,
      }),
    ],
    cache: {
      buildDependencies: {
        config: [__filename],
      },
    },
  });
};
