const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = function(env, args) {
  args.mode = 'production';
  return merge(common(env, args), {
    // Do not expose sources, but include source maps especially for JS stack traces
    devtool: 'nosources-source-map',
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true
        })
      ]
    }
  });
};
