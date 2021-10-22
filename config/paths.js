const path = require('path');
const fs = require('fs');

const appPath = fs.realpathSync(process.cwd());
const resolveAppPath = (relativePath) => path.resolve(appPath, relativePath);
const resolveConfigPath = (relativePath) =>
  path.resolve(__dirname, relativePath);
const rootPath = resolveAppPath('../../');
const resolveRootPath = (relativePath) => path.resolve(rootPath, relativePath);

const entries = {
  header: resolveAppPath('./Resources/Private/Javascript/header.js'),
  footer: resolveAppPath('./Resources/Private/Javascript/footer.js'),
  main: resolveAppPath('./Resources/Private/Scss/main.scss'),
  print: resolveAppPath('./Resources/Private/Scss/print.scss'),
};

const caches = {
  eslint: resolveAppPath('./node_modules/.cache/.eslintcache'),
  webpack: resolveAppPath('./node_modules/.cache'),
};

const misc = {
  rootPath: resolveAppPath('../../'),
  modernizr: resolveConfigPath('modernizr.js'),
  modules: [path.resolve('./node_modules'), 'node_modules'],
  tsConfig: resolveAppPath('tsconfig.json'),
  jsConfig: resolveAppPath('jsconfig.json'),
  tsBuildInfoFile: resolveAppPath('node_modules/.cache/tsconfig.tsbuildinfo'),
  yarnLockFile: resolveAppPath('yarn.lock'),
  appPath,
};

const sources = {
  modernizrBasePath: resolveConfigPath('.modernizrrc'),
  modernizrCustomPath: resolveAppPath('.modernizrrc'),
  iconPath: './Resources/Private/Icons/',
  javascript: './Resources/Private/Javascript',
  styles: './Resources/Private/Scss',
  components: './Resources/Private/Components',
  appNodeModules: resolveAppPath('node_modules'),
  srcFolder: resolveRootPath('./DistributionPackages'),
};

const buildTargets = {
  iconScss: './Resources/Private/Scss/_Sprites.scss',
  output: resolveAppPath('./Resources/Public/Dist'),
};

module.exports = {
  entries,
  caches,
  misc,
  sources,
  buildTargets,
};
