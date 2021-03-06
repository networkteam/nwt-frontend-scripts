const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

module.exports = function(env, args) {

  const basePackageName = args['basePackage'];
  const basePackagePathAbsolute = () => path.resolve(process.cwd(), `../${basePackageName}`);

  return merge(common(env, args), {
    // CSS loaders need inline source maps to work correctly
    devtool: 'eval-source-map',
    mode: 'development',
    target: 'node',
    module: {
      rules: [
        {
          test: /\.js?$/,
          include: [
            path.resolve('./Resources/Private/Javascript'),
            path.resolve(`${basePackagePathAbsolute()}/Resources/Private/Javascript`),
          ],
          exclude: /node_modules/,
          loader: require.resolve('babel-loader'),
          options: {
            "presets": [
              [
                require.resolve("@babel/preset-env"),
                {
                  "targets": {
                    "browsers": [
                      "> 1%",
                      "last 2 versions",
                      "IE 11",
                      "Safari >= 10",
                      "not IE < 11",
                      "not ExplorerMobile < 11"
                    ]
                  },
                  "modules": false
                }
              ],
              require.resolve("@babel/preset-react")
            ],
            "plugins": [
              [require.resolve("@babel/plugin-proposal-decorators"), {"legacy": true}],
              require.resolve("@babel/plugin-proposal-class-properties"),
              require.resolve("@babel/plugin-proposal-object-rest-spread")
            ]
          }
        },
        {
          test: /\.(js?$)/,
          exclude: /node_modules|\.test\.js$/,
          options: { esModules: true },
          enforce: 'post',
          loader: require.resolve('istanbul-instrumenter-loader')
        },
        {
          test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|eot|ttf)$/,
          use: [{
            loader: 'null-loader',
            options: {
              name: '[name].[ext]',
              useRelativePath: false
            }
          }]
        },
        {
          test: /\.(sass|scss)$/,
          use: [
            {
              loader: 'null-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new ExtraWatchWebpackPlugin({
        dirs: ['./Resources/Private/JavaScript', `${basePackagePathAbsolute()}/Resources/Private/JavaScript`]
      })
    ]
  });
}
