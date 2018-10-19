# nwt-frontend-scripts
Toolchain to build frontend assets

## Add own configuration

In project root add a custom webpack.js exporting a configuration function:

```Javascript
module.exports = function(env, args) {
  return {
      output: {
          path: newOutputPath
      }
  };
};
```