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

## Using modernizr

By default modernizr is generated with `setclasses` option and can be imported via

```Javascript
import Modernizr from 'modernizr'
```

To extend the configuration and add tests and feature detections, create a `.modernizrrc` in your Project Root:

```Javascript
module.exports = {
  "feature-detects": [
    "test/css/flexbox",
    "test/es6/promises",
    "test/serviceworker"
  ]
};
```

[See full configuration possibilities](https://github.com/Modernizr/Modernizr/blob/master/lib/config-all.json)