const { merge } = require('webpack-merge');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const common = require('./webpack.common.js');

module.exports = function (env, args) {
  args.mode = 'development';
  const enableLivereload = args['noLivereload'] ? false : true;
  const livereloadPlugin = enableLivereload ? [
    new LiveReloadPlugin({
      appendScriptTag: true,
    })
  ] : []
  return merge(common(env, args), {
    // CSS loaders need inline source maps to work correctly
    devtool: 'inline-source-map',
    plugins: [
      ...livereloadPlugin
    ],
    cache: {
      buildDependencies: {
        config: [__filename],
      },
    },
  });
};
