'use strict';

const { name, version } = require('./package.json');
const sortImports = require('./lib/rules/sort-imports.js');

const plugin = {
  meta: { name, version },
  rules: { 'sort-imports': sortImports },
  configs: {},
};

plugin.configs.recommended = {
  name: 'opinionated-imports/recommended',
  plugins: { 'opinionated-imports': plugin },
  rules: { 'opinionated-imports/sort-imports': 'error' },
};

module.exports = plugin;
