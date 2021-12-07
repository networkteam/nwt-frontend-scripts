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
  });
});
