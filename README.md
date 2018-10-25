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
    "webpack": "networkteam-asset-build prod --basePackage $npm_package_basePackageName",
    "webpack:dev": "networkteam-asset-build dev --basePackage $npm_package_basePackageName",
    "webpack:watch": "networkteam-asset-build watch --basePackage $npm_package_basePackageName"
  },
```

Webpack relies on four entry points to generate JS and CSS Assets:

%PROJECTROOT%/Resources/Private/Javascript/header.js // Generates header.js file
%PROJECTROOT%/Resources/Private/Javascript/footer.js // Generates footer.js file
%PROJECTROOT/Resources/Scss/main.scss // Generates main.css and empty main.js wich can be ignored
%PROJECTROOT/Resources/Scss/print.scss // Generates print.css and empty print.js wich can be ignored

Start the npm task:

```bash
npm start // file watcher with hot reload
npm run build:dev // Development build
npm run build // Production build
```

**Note:** Webpack generates a JS-File for every entry point including JS-Files. This will be improved in future Versions of webpack

The generated files will be copied to `%PROJECTROOT%/Resources/Public/Dist` including the assets used in CSS (e.g. bg-images or fonts). The paths for the CSS Assets are automatically corrected to the new path by webpack.

## Using Aliases

This workflow automatically provides aliases for an easier import from different folders:

* neosRoot: The root folder of your Neos installation
* baseJavascript Javascript components from base package (%BASEROOT%/Resources/Private/Javascript)
* baseStyles: Styles from basePackage (%BASEROOT%/Resources/Private/Scss use e.g '~baseStyles/main' to import main.scss)
* modernizr: Auto-Generated modernizr file (see below)

## Icon Font

Every SVG-File located in `%BASEROOT%/Resources/Private/Iconfont` will be included in an automatically generated Icon-Font. The Font-Files will be stored in `%BASEROOT%/Resources/Private/Fonts` and a SCSS-File can be found in `%BASEROOT%/Resources/Private/Scss/0_Base/Icons.scss`. This SCSS-File already kincludes the @font-face rules, classes for the icons to add a before-Element with the icojn (`.icon-%FILENAME%`) and also a mixin to use the icon on every element (`@include icon(%FILENAME%)`).

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