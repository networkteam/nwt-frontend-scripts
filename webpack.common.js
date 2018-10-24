const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const IconfontPlugin = require('iconfont-plugin-webpack');
const deepmerge = require('deepmerge');


module.exports = function(env, args) {
  const mode = args.mode;
  const basePackageName = args['basePackage'];
  const customerName = basePackageName.split('.')[0]

  const basePackagePathAbsolute = () => path.resolve(process.cwd(), `../${basePackageName}`);
  const modernizrBaseConfig = require(path.resolve(__dirname,'.modernizrrc'));
  let modernizrCustomConfig = {};

  try {
    modernizrCustomConfig = require(path.resolve(process.cwd(), '.modernizrrc'));
  } catch(e) {}

  const modernizrConfig = deepmerge(modernizrBaseConfig, modernizrCustomConfig)

  return {
    mode: mode,
    performance: {
      // Warn (fail on CI) if entrypoint size exceeds 350k
      maxEntrypointSize: 350000
    },
    externals: {
      jquery: 'jQuery'
    },
    entry: {
      header: './Resources/Private/Javascript/header.js',
      footer: './Resources/Private/Javascript/footer.js',
      main: './Resources/Private/Scss/main.scss',
      print: './Resources/Private/Scss/print.scss'
    },
    output: {
      path: path.resolve('./Resources/Public/Dist'),
      filename: '[name].js'
    },
    resolve: {
      alias: {
        baseJavascript: `${basePackagePathAbsolute()}/Resources/Private/Javascript`,
        baseStyles: `${basePackagePathAbsolute()}/Resources/Private/Scss`,
        neosRoot: path.resolve(process.cwd(), '../../'),
        modernizr$: path.resolve(__dirname, 'modernizr.js')
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
          test: /modernizr\.js$/,
          loader: require.resolve('webpack-modernizr-loader'),
          options: modernizrConfig
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
      new IconfontPlugin({
        src: path.resolve(`${basePackagePathAbsolute()}/Resources/Private/Iconfont/`),
        family: `${customerName}-icons`,
        dest: {
          font: `${path.resolve(basePackagePathAbsolute())}/Resources/Private/Fonts/[family].[type]`,
          css: `${path.resolve(basePackagePathAbsolute())}/Resources/Private/Scss/0_Base/_Icons.scss`
        },
        watch: {
          pattern: `${path.resolve(basePackagePathAbsolute())}/Resources/Private/Iconfont/*.svg`,
          cwd: undefined
        },
         cssTemplate: require('./templates/_Icons.scss-template.js')
      }),
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

