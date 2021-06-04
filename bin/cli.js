#!/usr/bin/env node

const build = require('../scripts/build');
const watch = require('../scripts/watch');
const test = require('../scripts/test');

const script = process.argv[2];

switch (script) {
  case 'dev':
    build(script);
    break;
  case 'prod':
    process.env.BABEL_ENV = 'production';
    process.env.NODE_ENV = 'production';

    build(script);
    break;
  case 'watch':
    watch('dev');
    break;
  case 'test':
    test();
    break;
  case 'test-watch':
    test({ watch: true });
    break;
  default:
    console.error(
      `Unknown environment "${script}", expected "dev", "prod" or "test / test-watch`
    );
    process.exit(1);
}
