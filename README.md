# nwt-frontend-scripts
A webpack based workflow to create frontend-assets.

## Features
* Browser-Ready Javascript from ESNext-Modules
* CSS-Generation from SCSS with autoprefixer
* Icon-Sprite Generation from SVG files
* Asset-Resolver and copier

## Getting started

To use this workflow in your projects, install the package with npm or yarn

```bash
npm install @networkteam/frontend-scripts
```

Define variables in your `package.json`:

```json
{
  "basePackageName": "Customer.Base",
  "sitePackageName": "Customer.Site"
}
```

> Alternatively set the variables `BASE_PACKAGE_NAME` and `SITE_PACKAGE_NAME` in an .env file in the directory of your package.json. This is mandatory when using workspaces in a monorepo as package-variables are not always available in the workspace.

Copy the scripts to your package.json:

```json
  "scripts": {
    "build": "npm run webpack",
    "build:dev": "npm run webpack:dev",
    "start": "npm run webpack:watch",
    "test": "npm run webpack:test",
    "test-watch": "npm run webpack:test-watch",
    "webpack": "networkteam-asset-build prod",
    "webpack:dev": "networkteam-asset-build dev",
    "webpack:watch": "networkteam-asset-build watch",
    "webpack:test": "networkteam-asset-build test",
    "webpack:test-watch": "networkteam-asset-build test-watch"
  },
```

Webpack relies on four entry points to generate JS and CSS Assets:

* header.js: %PROJECTROOT%/Resources/Private/Javascript/header.js
* footer.js: %PROJECTROOT%/Resources/Private/Javascript/footer.js
* main.css: %PROJECTROOT%/Resources/Private/Scss/main.scss
* print.css: %PROJECTROOT%/Resources/Private/Scss/print.scss

Start the npm task:

```bash
npm start // file watcher with hot reload
npm run build:dev // Development build
npm run build // Production build
npm run test // Testing with code coverage recap
npm run test-watch // Run watcher for TDD
```

**Note:** Webpack generates a JS-File for every entry point including JS-Files. This will be improved in future Versions of webpack

The generated files will be copied to `%PROJECTROOT%/Resources/Public/Dist` including the assets used in CSS (e.g. bg-images or fonts). The paths for the CSS Assets are automatically corrected to the new path by webpack.

## Using Aliases

This workflow automatically provides aliases for an easier import from different folders:

* **rootPath**: The root folder of your project
* **baseJavascript**: Javascript components from base package (%BASEROOT%/Resources/Private/Javascript)
* **baseStyles**: Styles from basePackage (%BASEROOT%/Resources/Private/Scss use e.g `~baseStyles/main` to import main.scss)
* **modernizr**: Auto-Generated modernizr file (see below)

## Icon Sprite

Every SVG-File located in `%BASEROOT%/Resources/Private/Icons` will be included in an automatically generated Svgsprite. The sprite itself will be stored in `%BASEROOT%/Resources/Public/Dist` and a SCSS-File can be found in `%BASEROOT%/Resources/Private/Scss/_sprite.scss`. This SCSS-File includes the mixins to use the icon on every element (`@include sprite(%FILENAME%)`) although this way is not encouraged due to repeated server requests.

To prevent Iconsprite from being built, use the `--noIconSprite` Flag in your npm tasks

## Environment Variables

By default the scripts pass two environment variables to use in your code: NODE_ENV and CUSTOMER_NAME, that can be accessed via process.env. If you need additional variables e.g. to define an api endpoint, you have to prefix this variable with `NWT_APP_`.

```
.env

NWT_APP_ENDPOINT = http://localhost:3000

api.js
const endpoint = process.env.NWT_APP_ENDPOINT
```

## Add own configuration

If you need a special configuration for your Project, you can add a custom webpack.js to your project root. It will be included automatically:

```Javascript
module.exports = function(env, args) {
  return {
      output: {
          path: newOutputPath
      }
  };
};
```

If you want to adapt predefined rules and merge them to one, you may do so by matching `test`-expression:

```Javascript
module.exports = function(env, args) {
  return {
    module: {
      rules: [
        {
          test: /\.(sass|scss)$/,  // use same expression used by plugin to merge
          ...
        }
      ]
    },
  };
};
```

To remove entry points from webpack, you can set them to null in your own configuration

## Using modernizr

By default a modernizr custom build is generated with `setclasses` option and can be imported via

```Javascript
import Modernizr from 'modernizr'; // as named import
import 'modernizr'; // direct import
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

## Usage in standalone projects

The scripts are designed to work with a Neos or Typo3 folder structure, for the most parts it is also possible to use them in other projects. Therefore you have to define your base- and site-package as `.` in your package.json

```json
{
  "basePackageName": ".",
  "sitePackageName": "."
}
```


Additionally you have to turn off the icon sprite generator, because it relies on a specific place, where the icons are stored. E.g. in your package.json.


```json
  "scripts": {
    "build": "npm run webpack --noIconSprite",
  },
```

Also, you might want to change the entry points and output paths via a custom webpack configuration (see above)

```javascript
module.exports = function () {
  return {
    entry: {
      header: null,
      footer: null,
      main: "./src/index.js",
      print: null,
    },
    output: {
      path: './dist'
    },
  };
};
```

## Testing

For unit testing create a file `${your-filename}.test.js` within your javascript folder.
Webpack will watch for files within the javascript directory ending on `*.test.js`.
Run your tests by simply start `npm run test`.

If you want to test with the BDD approach, you can start the script with `npm run test-watch`.
This will reload the tests with every save.

We use `chai` as assertion and `sinon` as mocking library.
Within the testing environment you have access to the following global variables:
  * `chai`
  * `sinon`
  * `expect` - the `chai.expect`
  * `assert` - the `chai.assert`
  * `sandbox` - the `sinon.sandbox`

You can also use `window` and `document`, as usual.

Here you get more information about [Sinon](https://sinonjs.org/) and [Chai - BDD](https://www.chaijs.com/api/bdd/)

**Example:**
```js
// Resources/Private/Javscript/Custom/Component/ComponentToTest.test.js

/*global describe, it, beforeEach, afterEach, sandbox*/
import ComponentToTest from './ComponentToTest';

describe('ComponentToTest', () => {
  let component = null;
  beforeEach(done => {
    component = new ComponentToTest();
    // do some stuff before each testing step
    document.body.innerHTML = '<div id="myContainer"></<div>';
    done();
  });

  afterEach(done => {
    // do some stuff after each testing step
    document.body.innerHTMl = '';
    done();
  });

    describe('some tests with special attributes', () => {
      it('it should do something', done => {
        // do something with <component>
        component.initialize();

        // do some expectations concerning <component>.
        expect(component).to.have.property('initialized').equals(true);
        done();
      });
    });
  }
}
```


## Release a new version:

### Pre-releases

To create a pre-release one can push/merge changes to branch next. This triggers actions to automatically create a pre-release.
Use `@next` as version in your project package.json to use the current pre-release.

### Releases

1. Merge your branch/changes into main branch
2. Bump version in package.json with `npm version [<newversion> | major | minor | patch`
3. Push bumped version to main-branch with `git push --tags`
4. Create a new release with release notes from newly created tag on github
5. The new release will trigger GitHub Actions for automatically publishing to NPM
