# nwt-frontend-scripts
A webpack based workflow to create frontend-assets.

## Features
* Browser-Ready Javascript from ESNext-Modules
* CSS-Generation from SCSS with autoprefixer
* Icon-Font Generation from SVG files
* Asset-Resolver and copier

## Getting started

To use this workflow in your projects, install the package with npm or yarn

```bash
npm install @networkteam/frontend-scripts
```

Add BasePackageName and copy the scripts to your package.json:

```json
  "basePackageName": "Customer.Base",
  "scripts": {
    "build": "npm run webpack",
    "build:dev": "npm run webpack:dev",
    "start": "npm run webpack:watch",
    "test": "npm run webpack:test",
    "test-watch": "npm run webpack:test-watch",
    "webpack": "networkteam-asset-build prod --basePackage $npm_package_basePackageName",
    "webpack:dev": "networkteam-asset-build dev --basePackage $npm_package_basePackageName",
    "webpack:watch": "networkteam-asset-build watch --basePackage $npm_package_basePackageName",
    "webpack:test": "networkteam-asset-build test --basePackage $npm_package_basePackageName",
    "webpack:test-watch": "networkteam-asset-build test-watch --basePackage $npm_package_basePackageName"
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

Every SVG-File located in `%BASEROOT%/Resources/Private/Icons` will be included in an automatically generated Svgsprite. The Font-Files will be stored in `%BASEROOT%/Resources/Public/Dist` and a SCSS-File can be found in `%BASEROOT%/Resources/Private/Scss/_sprite.scss`. This SCSS-File includes the mixins to use the icon on every element (`@include sprite(%FILENAME%)`) although this is way is not encouraged due to repeated server requests.

To prevent Iconsprite from being built, use the `--noIconSprite` Flag in your npm tasks

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
