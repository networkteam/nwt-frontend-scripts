
const { JSDOM } = require('jsdom');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// Sets defaults for testing
module.exports = {
  prepareTestEnvironment: function() {
    const { window } = new JSDOM('<!doctype html><html><body></body></html>');

    function createContextualFragment(html) {
      const div = document.createElement('div');
      div.innerHTML = html;

      return div.children[0];
    };

    function copyProps(src, target) {
      const props = Object.getOwnPropertyNames(src)
        .filter(prop => typeof target[prop] === 'undefined')
        .reduce((result, prop) => ({
          ...result,
          [prop]: Object.getOwnPropertyDescriptor(src, prop),
        }), {});
      Object.defineProperties(target, props);
    }

    chai.use(sinonChai);

    global.expect = chai.expect;
    global.assert = chai.assert;
    global.chai = chai;
    global.sinon = sinon;
    global.sandbox = sinon.createSandbox();
    global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
    global.window = window;
    global.document = window.document;
    global.navigator = {
      userAgent: 'node.js',
    };
    global.Range = function Range() {};

    Range.prototype.createContextualFragment = (html) => createContextualFragment(html);

    global.window.document.createRange = function createRange() {
      return {
        setEnd: () => {},
        setStart: () => {},
        getBoundingClientRect: () => {
          return { right: 0 };
        },
        getClientRects: () => [],
        createContextualFragment,
      };
    };

    copyProps(window, global);
  }
}

