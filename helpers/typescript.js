'use strict';

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const paths = require('../config/paths');
const os = require('os');
const immer = require('immer').produce;
const globby = require('globby').sync;
const prompts = require('prompts');
const resolve = require('resolve');
const generateDefaultOptions = require('../config/tsCompilerDefaults');

const writeJson = (fileName, object) => {
  fs.writeFileSync(
    fileName,
    JSON.stringify(object, null, 2).replace(/\n/g, os.EOL) + os.EOL
  );
};

/**
 * Checks if ts files exist in scope
 *
 * @returns {boolean}
 */
const verifyTypeScriptFilesExist = () => {
  const typescriptFiles = globby(
    ['**/*.(ts|tsx)', '!**/node_modules', '!**/*.d.ts'],
    { cwd: path.resolve(paths.sources.srcFolder) }
  );
  if (typescriptFiles.length > 0) {
    console.warn(
      chalk.yellow(
        `TypeScript files in your project detected (${chalk.bold(
          `${typescriptFiles[0]}`
        )}).`
      )
    );
    console.warn();
    return true;
  }
  return false;
};

/**
 * Adds tsConfig if necessary
 *
 * @returns {Object} has written tsConfig
 */
const secureTypeScriptConfigExists = async () => {
  if (fs.existsSync(paths.misc.tsConfig)) {
    return { tsConfigWritten: false };
  }

  const shouldWriteTsConfig = await prompts({
    type: 'confirm',
    name: 'result',
    message: 'Generate a configuration file?',
    initial: true,
  });

  if (!shouldWriteTsConfig.result) {
    return { tsConfigWritten: false };
  }

  writeJson(paths.misc.tsConfig, {});
  return { tsConfigWritten: true };
};

const checkAndReceiveTypeScript = () => {
  const isYarn = fs.existsSync(paths.misc.yarnLockFile);
  let ts;
  try {
    // TODO: Remove this hack once `globalThis` issue is resolved
    // https://github.com/jsdom/jsdom/issues/2961
    const globalThisWasDefined = !!global.globalThis;
    ts = require(resolve.sync('typescript', {
      basedir: paths.sources.appNodeModules,
    }));

    if (!globalThisWasDefined && !!global.globalThis) {
      delete global.globalThis;
    }
    return ts;
  } catch (_) {
    console.log('error');
    console.error(
      chalk.bold.red(
        `It looks like you're trying to use TypeScript but do not have ${chalk.bold(
          'typescript'
        )} installed.`
      )
    );
    console.error(
      chalk.bold(
        'Please install',
        chalk.cyan.bold('typescript'),
        'by running',
        chalk.cyan.bold(
          isYarn ? 'yarn add typescript' : 'npm install typescript'
        ) + '.'
      )
    );
    console.error(
      chalk.bold(
        'If you are not trying to use TypeScript, please remove the ' +
          chalk.cyan('tsconfig.json') +
          ' file from your package root (and any TypeScript files).'
      )
    );
    console.error();
    process.exit(1);
  }
};

/**
 *
 *
 * @param {*} ts typescript instance
 * @param {boolean} firstTimeSetup
 */
const validateTypeScriptSetup = async (ts, firstTimeSetup) => {
  const formatDiagnosticHost = {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => os.EOL,
  };

  const messages = [];
  let appTsConfig;
  let parsedTsConfig;
  let parsedCompilerOptions;
  try {
    const { config: readTsConfig, error } = ts.readConfigFile(
      paths.misc.tsConfig,
      ts.sys.readFile
    );

    if (error) {
      throw new Error(ts.formatDiagnostic(error, formatDiagnosticHost));
    }

    appTsConfig = readTsConfig;

    // Get TS to parse and resolve any "extends"
    // Calling this function also mutates the tsconfig above,
    // adding in "include" and "exclude", but the compilerOptions remain untouched
    let result;
    parsedTsConfig = immer(readTsConfig, (config) => {
      result = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        path.dirname(paths.misc.tsConfig)
      );
    });

    if (result.errors && result.errors.length) {
      throw new Error(
        ts.formatDiagnostic(result.errors[0], formatDiagnosticHost)
      );
    }

    parsedCompilerOptions = result.options;
  } catch (e) {
    if (e && e.name === 'SyntaxError') {
      console.error(
        chalk.red.bold(
          'Could not parse',
          chalk.cyan('tsconfig.json') + '.',
          'Please make sure it contains syntactically correct JSON.'
        )
      );
    }

    console.log(e && e.message ? `${e.message}` : '');
    process.exit(1);
  }

  if (appTsConfig.compilerOptions == null) {
    appTsConfig.compilerOptions = {};
    firstTimeSetup = true;
  }

  const defaultCompilerOptions = generateDefaultOptions(ts);

  for (const option of Object.keys(defaultCompilerOptions)) {
    const { parsedValue, value, suggested, reason } =
      defaultCompilerOptions[option];

    const valueToCheck = parsedValue === undefined ? value : parsedValue;
    const coloredOption = chalk.cyan('compilerOptions.' + option);

    if (suggested != null) {
      if (parsedCompilerOptions[option] === undefined) {
        appTsConfig = immer(appTsConfig, (config) => {
          config.compilerOptions[option] = suggested;
        });
        messages.push(
          `${coloredOption} to be ${chalk.bold(
            'suggested'
          )} value: ${chalk.cyan.bold(suggested)} (this can be changed)`
        );
      }
    } else if (parsedCompilerOptions[option] !== valueToCheck) {
      appTsConfig = immer(appTsConfig, (config) => {
        config.compilerOptions[option] = value;
      });
      messages.push(
        `${coloredOption} ${chalk.bold(
          valueToCheck == null ? 'must not' : 'must'
        )} be ${valueToCheck == null ? 'set' : chalk.cyan.bold(value)}` +
          (reason != null ? ` (${reason})` : '')
      );
    }
  }

  // tsconfig will have the merged "include" and "exclude" by this point
  if (parsedTsConfig.include == null) {
    appTsConfig = immer(appTsConfig, (config) => {
      config.include = [paths.sources.srcFolder];
    });
  }

  if (messages.length > 0) {
    let writeConfig = firstTimeSetup;
    if (firstTimeSetup) {
      console.log(
        chalk.bold(
          'Your',
          chalk.cyan('tsconfig.json'),
          'has been populated with default values.'
        )
      );
      console.log();
    } else {
      console.warn(
        chalk.bold(
          'The following changes should be made to your',
          chalk.cyan('tsconfig.json'),
          'file:'
        )
      );
      messages.forEach((message) => {
        console.warn('  - ' + message);
      });
      console.warn();
      const shouldWriteTsConfig = await prompts({
        type: 'confirm',
        name: 'result',
        message: 'Automatically change configuration file?',
        initial: true,
      });

      writeConfig = shouldWriteTsConfig.result;
    }
    if (writeConfig) {
      writeJson(paths.misc.tsConfig, appTsConfig);
    }
  }
};

const verifyTypeScriptSetup = async () => {
  const usesTypescript = verifyTypeScriptFilesExist();

  if (usesTypescript) {
    const { tsConfigWritten } = await secureTypeScriptConfigExists();

    const tsInstance = checkAndReceiveTypeScript();

    if (!tsInstance) {
      throw new Error('Typescript not found');
    }

    await validateTypeScriptSetup(tsInstance, tsConfigWritten);
  }
};

module.exports = {
  verifyTypeScriptSetup,
  verifyTypeScriptFilesExist,
  secureTypeScriptConfigExists,
  checkAndReceiveTypeScript,
  validateTypeScriptSetup,
};
