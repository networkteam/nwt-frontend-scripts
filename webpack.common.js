const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function(env, args) {
  const mode = args.mode;

  const basePackagePathAbsolute = () => path.resolve(process.cwd(), '../Customer.Base');

  return {
    mode: mode,
    performance: {
      // Warn (fail on CI) if entrypoint size exceeds 350k
      maxEntrypointSize: 350000
    },
    externals: {
    },
    entry: [
      './Resources/Private/Javascript/header.js',
      './Resources/Private/Javascript/footer.js',
      './Resources/Private/Sass/main.scss'
    ],
    output: {
      filename: '[name].js',
      path: path.resolve('./Resources/Public/Dist')
    },
    resolve: {
      alias: {
        jsComponents: `${basePackagePathAbsolute()}/Resources/Private/Javascript`,
        baseStyles: `${basePackagePathAbsolute()}/Resources/Private/Scss`
      },
      modules: [
        path.resolve('./node_modules'),
        'node_modules'
      ]
    },
    module: {
      rules: [
        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        {
          test: /\.(js|jsx)$/,
          enforce: 'pre',
          use: [
            {
              options: {
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint'),
                // @remove-on-eject-begin
                baseConfig: {
                  extends: [require.resolve('eslint-config-react-app')],
                  settings: {react: {version: '999.999.999'}},
                },
                ignore: false,
                useEslintrc: true
                // @remove-on-eject-end
              },
              loader: require.resolve('eslint-loader')
            }
          ],
          include: path.resolve('./Resources/Private/Javascript')
        },
        {
          test: /\.js?$/,
          include: [
            path.resolve('./Resources/Private/Javascript'),
            path.resolve(`${basePackagePathAbsolute()}/Resources/Private/Javascript/`)
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
          test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|eot|ttf)$/,
          use: [{
            loader: require.resolve('file-loader'),
            options: {
              name: '[name].[ext]',
              useRelativePath: false
            }
          }]
        },
        {
          test: /\.(sass|scss)$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: require.resolve('css-loader'),
              options: {
                sourceMap: true
              }
            },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                plugins: [
                  require('autoprefixer')()
                ],
                sourceMap: true
              }
            },
            {
              loader: require.resolve('sass-loader'),
              options: {
                sourceMap: true,
                outputStyle: mode === 'production' ? 'compressed' : 'nested'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css'
      })
    ],
    resolveLoader: {
      modules: [
        // this path is the correct one when building an external Neos Module.
        path.resolve(__dirname, './node_modules')
      ]
    }
  };
};

