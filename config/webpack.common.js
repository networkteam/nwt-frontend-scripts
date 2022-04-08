// Env variables
require('dotenv').config();

// node functions and tools
const path = require('path');
const fs = require('fs');
const deepmerge = require('deepmerge');
const resolve = require('resolve');

// Plugins
const { DefinePlugin, IgnorePlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MessageHelperPlugin = require('../helpers/messageHelper');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');

// Helper
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');
const getClientEnv = require('../helpers/clientEnv');
const createEnvHash = require('../helpers/createEnvHash');

const paths = require('./paths');

const basePackageName = process.env['npm_package_basePackageName'] || process.env['BASE_PACKAGE_NAME'];
const sitePackageName = process.env['npm_package_sitePackageName'] || process.env['SITE_PACKAGE_NAME'];
const useTypeScript = fs.existsSync(paths.misc.tsConfig);
const customerName = basePackageName.split('.')[0];
const clientEnv = getClientEnv({ CUSTOMER_NAME: customerName });
const basePackagePathAbsolute = () =>
  path.resolve(process.cwd(), `../${basePackageName}`);
const iconPath = path.resolve(
  basePackagePathAbsolute(),
  paths.sources.iconPath
);
const modernizrBaseConfig = require(paths.sources.modernizrBasePath);
let modernizrCustomConfig = {};

try {
  modernizrCustomConfig = require(paths.sources.modernizrCustomPath);
} catch (e) {}

const modernizrConfig = deepmerge(modernizrBaseConfig, modernizrCustomConfig);
const baseAlias = {
  baseJavascript: path.resolve(
    basePackagePathAbsolute(),
    paths.sources.javascript
  ),
  baseStyles: path.resolve(basePackagePathAbsolute(), paths.sources.styles),
  baseComponents: path.resolve(
    basePackagePathAbsolute(),
    paths.sources.components
  ),
  rootPath: paths.misc.rootPath,
  modernizr$: paths.misc.modernizr,
};

module.exports = function (webpackEnv, args) {
  const mode = args.mode;
  const projectType = args['projectType'];
  const generateIconFont = args['noIconSprite'] ? false : true;
  const isNeos = projectType === 'neos';
  const isTypo3 = projectType === 'typo3';
  const isEnvDevelopment = webpackEnv === 'development';

  const iconSpritePlugin = generateIconFont
    ? [
        new SVGSpritemapPlugin([`${iconPath}/**/*.svg`], {
          output: {
            filename: `${customerName}-iconsprite.svg`,
          },
          styles: {
            // Cannot use SCSS here because node-sass
            filename: path.resolve(
              basePackagePathAbsolute(),
              paths.buildTargets.iconScss
            ),
            variables: {
              sizes: 'spriteSize',
              variables: 'spriteVariables',
            },
          },
        }),
      ]
    : [];

  return {
    mode: mode,
    performance: {
      // Warn (fail on CI) if entrypoint size exceeds 350k
      maxEntrypointSize: 350000,
    },
    externals: {
      jquery: 'jQuery',
    },
    entry: paths.entries,
    output: {
      path: paths.buildTargets.output,
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: `/_Resources/Static/Packages/${sitePackageName}/Dist/`,
    },
    resolve: {
      alias: baseAlias,
      modules: paths.misc.modules,
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /modernizr\.js$/,
          loader: require.resolve('webpack-modernizr-loader'),
          options: modernizrConfig,
        },
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: /@babel(?:\/|\\{1,2})runtime|pdfjs-dist/,
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              [
                require.resolve('@babel/preset-env'),
                {
                  targets: {
                    browsers: [
                      '> 1%',
                      'last 2 versions',
                      'IE 11',
                      'Safari >= 10',
                      'not IE < 11',
                      'not ExplorerMobile < 11',
                    ],
                  },
                  modules: false,
                },
              ],
              require.resolve('@babel/preset-react'),
              require.resolve('@babel/preset-typescript'),
            ],
            cacheDirectory: true,
            cacheCompression: false,
            cacheIdentifier: getCacheIdentifier(
              isEnvDevelopment ? 'development' : 'production',
              ['@babel/preset-react', 'react-dev-utils']
            ),
            plugins: [
              [
                require.resolve('@babel/plugin-proposal-decorators'),
                { legacy: true },
              ],
              require.resolve('@babel/plugin-proposal-class-properties'),
              require.resolve('@babel/plugin-proposal-object-rest-spread'),
            ],
          },
        },
        {
          test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|eot|ttf)$/,
          use: [
            {
              loader: require.resolve('file-loader'),
              options: {
                name: '[name].[ext]',
                useRelativePath: false,
              },
            },
          ],
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
                sourceMap: true,
              },
            },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                postcssOptions: {
                  plugins: [require('autoprefixer')()],
                },
                sourceMap: true,
              },
            },
            {
              loader: require.resolve('sass-loader'),
              options: {
                implementation: require.resolve("sass"),
                sourceMap: true,
                sassOptions: {
                  outputStyle: mode === 'production' ? 'compressed' : 'expanded',
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      // Needed until create react app has updated to Webpack 5
      new MessageHelperPlugin(),
      // Generate better information on not found modules (not necessary)
      // Not yet supported by WP5
      // new ModuleNotFoundPlugin(process.cwd()),
      new CaseSensitivePathsPlugin(),
      ...iconSpritePlugin,
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
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
        cacheLocation: paths.caches.eslint,
        cwd: fs.realpathSync(process.cwd()),
        fix: true,
        resolvePluginsRelativeTo: process.cwd(),
        useEslintrc: false,
        baseConfig: {
          extends: [require.resolve('eslint-config-react-app/base')],
          rules: {
            'react/react-in-jsx-scope': 'error',
          },
        },
      }),
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.sources.appNodeModules,
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.misc.tsBuildInfoFile,
              },
            },
            context: paths.sources.srcFolder,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: 'write-references',
          },
          logger: {
            infrastructure: 'silent',
          },
        }),
    ].filter(Boolean),
    resolveLoader: {
      modules: [
        //TODO: Do we need this?
        // this path is the correct one when building an external Neos Module.
        path.resolve(__dirname, './node_modules'),
      ],
    },
    cache: {
      type: 'filesystem',
      version: createEnvHash(clientEnv),
      cacheDirectory: paths.caches.webpack,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.misc.tsConfig, paths.misc.jsConfig].filter((f) =>
          fs.existsSync(f)
        ),
      },
    },
  };
};
