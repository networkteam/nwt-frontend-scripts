require('dotenv').config()
const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const deepmerge = require('deepmerge');
const { DefinePlugin } = require( 'webpack' );
const getClientEnv = require('./helpers/clientEnv');
const MessageHelperPlugin =  require('./helpers/messageHelper')
const ESLintPlugin = require('eslint-webpack-plugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');


module.exports = function(webpackEnv, args) {
  const mode = args.mode;
  const basePackageName = process.env['BASE_PACKAGE_NAME'];
  const sitePackageName = process.env['SITE_PACKAGE_NAME'];
  const projectType = args['projectType'];
  const generateIconFont = args['noIconSprite'] ? false : true;
  const isNeos = projectType === 'neos';
  const isTypo3 = projectType === 'typo3';
  const customerName = basePackageName.split('.')[0]
  const clientEnv = getClientEnv({CUSTOMER_NAME: customerName});
  const isEnvDevelopment = webpackEnv === 'development';

  const basePackagePathAbsolute = () => path.resolve(process.cwd(), `../${basePackageName}`);
  const iconPath = path.resolve(`${basePackagePathAbsolute()}/Resources/Private/Icons/`);
  const modernizrBaseConfig = require(path.resolve(__dirname,'.modernizrrc'));
  let modernizrCustomConfig = {};

  try {
    modernizrCustomConfig = require(path.resolve(process.cwd(), '.modernizrrc'));
  } catch(e) {}

  const iconSpritePlugin = generateIconFont ? [new SVGSpritemapPlugin([`${iconPath}/**/*.svg`], {
    output: {
      filename: `${customerName}-iconsprite.svg`
    },
    styles: {
      // Cannot use SCSS here because node-sass
      filename: `${path.resolve(basePackagePathAbsolute())}/Resources/Private/Scss/_Sprites.scss`,
      variables: {
        sizes: 'spriteSize',
        variables: 'spriteVariables'
      }
    }
  })] : []

  const modernizrConfig = deepmerge(modernizrBaseConfig, modernizrCustomConfig);
  const baseAlias = {
    baseJavascript: `${basePackagePathAbsolute()}/Resources/Private/Javascript`,
    baseStyles: `${basePackagePathAbsolute()}/Resources/Private/Scss`,
    baseComponents: `${basePackagePathAbsolute()}/Resources/Private/Components`,
    rootPath: path.resolve(process.cwd(), '../../'),
    modernizr$: path.resolve(__dirname, 'modernizr.js')
  };

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
      print: './Resources/Private/Scss/print.scss',
    },
    output: {
      path: path.resolve('./Resources/Public/Dist'),
      filename: '[name].js',
      chunkFilename: "[name].js",
      publicPath:
        `/_Resources/Static/Packages/${sitePackageName}/Dist/`,
    },
    resolve: {
      alias: baseAlias,
      modules: [
        path.resolve('./node_modules'),
        'node_modules'
      ]
    },
    module: {
      rules: [
        {
          test: /modernizr\.js$/,
          loader: require.resolve('webpack-modernizr-loader'),
          options: modernizrConfig
        },
        {
          test: /\.js?$/,
          exclude: /@babel(?:\/|\\{1,2})runtime|pdfjs-dist/,
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
          test: /\.svg$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                prettier: false,
                svgo: false,
                svgoConfig: {
                  plugins: [{ removeViewBox: false }],
                },
                titleProp: true,
                ref: true,
              },
            },
            {
              loader: 'file-loader',
              options: {
                name: 'static/media/[name].[hash].[ext]',
              },
            },
          ],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
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
                postcssOptions: {
                  plugins: [
                    require('autoprefixer')()
                  ],
                },
                sourceMap: true
              }
            },
            {
              loader: require.resolve('sass-loader'),
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: mode === 'production' ? 'compressed' : 'nested'
                }
              }
            }
          ]
        }
      ]
    },
    plugins: [
      // Needed until create react app has updated to Webpack 5
      new MessageHelperPlugin(),
      // Generate better information on not found modules (not necessary)
      // Not yet supported by WP5
      // new ModuleNotFoundPlugin(process.cwd()),
      ...iconSpritePlugin,
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css'
      }),
      new DefinePlugin(clientEnv.stringified),
      new ESLintPlugin({
        // Plugin options
        extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
        formatter: require.resolve('react-dev-utils/eslintFormatter'),
        eslintPath: require.resolve('eslint'),
        failOnError: true,
        context: fs.realpathSync(process.cwd()),
        cache: true,
        cacheLocation: path.resolve(
          'node_modules',
          '.cache/.eslintcache'
        ),
        cwd: fs.realpathSync(process.cwd()),
        fix: true,
        resolvePluginsRelativeTo: __dirname,
        useEslintrc: false,
        baseConfig: {
          extends: [require.resolve('eslint-config-react-app/base')],
          rules: {
              'react/react-in-jsx-scope': 'error',
          },
        },
      }),
    ],
    resolveLoader: {
      modules: [
        // this path is the correct one when building an external Neos Module.
        path.resolve(__dirname, './node_modules')
      ]
    }
  };
};

