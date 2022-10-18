const { combineConfigurations } = require('./configHelpers');

const expect = require('chai').expect;

describe('configHelpers', function () {
  describe('combineConfigurations', function () {
    const mockBabelLoader = function () {};
    const mockCssExtractLoader = function () {};
    const mockCssLoader = function () {};
    const mockPostCssLoader = function () {};
    const mockSassLoader = function () {};
    const mockAutoprefixerPlugin = function () {};

    class SVGSpritemapPlugin {
      constructor(options) {
        this.options = options;
      }
    }

    const defaultConfiguration = function (env, args) {
      const mode = args.mode;
      return {
        entry: {
          header: 'header.js',
        },
        module: {
          rules: [
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              loader: mockBabelLoader,
            },
            {
              test: /\.(sass|scss)$/,
              use: [
                mockCssExtractLoader,
                {
                  loader: mockCssLoader,
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader: mockPostCssLoader,
                  options: {
                    postcssOptions: {
                      plugins: [mockAutoprefixerPlugin],
                    },
                    sourceMap: true,
                  },
                },
                {
                  loader: mockSassLoader,
                  options: {
                    sourceMap: true,
                    sassOptions: {
                      outputStyle:
                        mode === 'production' ? 'compressed' : 'nested',
                    },
                  },
                },
              ],
            },
          ],
        },
        plugins: [
          new SVGSpritemapPlugin({
            output: {
              filename: `iconsprite-frontend-scripts.svg`,
            },
            styles: {
              filename: 'a path to a file',
              variables: {
                sizes: 'nwtSizes',
                sprites: 'nwtSprites',
                variables: 'nwtVariables',
              },
            },
          }),
        ],
      };
    };

    describe('with unset entry in custom config', function () {
      const customConfiguration = function (env, args) {
        return {
          entry: {
            header: null,
            footer: 'footer.js',
          },
        };
      };

      it('is removed from entries', function () {
        const config = combineConfigurations(
          defaultConfiguration,
          customConfiguration
        )('dev', { mode: 'development' });
        expect(config.entry).to.deep.eq({
          footer: 'footer.js',
        });
      });
    });

    describe('with existing rule with overwritten loader', function () {
      const mockTailwindPlugin = function () {};

      const customConfiguration = function (env, args) {
        return {
          module: {
            rules: [
              {
                test: /\.(sass|scss)$/,
                use: [
                  {
                    loader: mockPostCssLoader,
                    options: {
                      postcssOptions: {
                        plugins: [mockTailwindPlugin, mockAutoprefixerPlugin],
                      },
                      sourceMap: true,
                    },
                  },
                ],
              },
            ],
          },
        };
      };

      it('replaces an existing loader', function () {
        const config = combineConfigurations(
          defaultConfiguration,
          customConfiguration
        )('dev', { mode: 'development' });
        expect(config.module.rules).to.have.length(2);
        expect(config.module.rules[1].use).to.have.length(4);
        expect(config.module.rules[1].use[2]).to.deep.eq({
          loader: mockPostCssLoader,
          options: {
            postcssOptions: {
              plugins: [mockTailwindPlugin, mockAutoprefixerPlugin],
            },
            sourceMap: true,
          },
        });
      });
    });

    describe('with existing plugin with overwritten config', function () {
      const mockTailwindPlugin = function () {};

      const customConfiguration = function (env, args) {
        return {
          plugins: [
            new SVGSpritemapPlugin({
              output: {
                filename: `a different file name`,
              },
            }),
          ],
        };
      };

      it('replaces output filename and keeps rest of the config', function () {
        const config = combineConfigurations(
          defaultConfiguration,
          customConfiguration
        )('dev', { mode: 'development' });
        console.log(
          'lelele',
          config.plugins[0].options.output.filename
        );
        expect(config.plugins).to.have.length(1);
        expect(config.plugins[0].options.output.filename).to.equal(
          'a different file name'
        );
        expect(config.plugins[0].options).to.deep.eq({
          output: {
            filename: `a different file name`,
          },
          styles: {
            filename: 'a path to a file',
            variables: {
              sizes: 'nwtSizes',
              sprites: 'nwtSprites',
              variables: 'nwtVariables',
            },
          },
        });
      });
    });
  });
});
