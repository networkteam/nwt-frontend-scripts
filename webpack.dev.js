const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = function(env, args) {
  args.mode = 'development';
  return merge(common(env, args), {
    // CSS loaders need inline source maps to work correctly
    devtool: 'inline-source-map',
    plugins: [
      new LiveReloadPlugin({
        appendScriptTag: true
      })
    ]
  });
};
