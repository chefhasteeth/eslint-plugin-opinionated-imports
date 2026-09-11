'use strict';

const stylistic = require('@stylistic/eslint-plugin');
const plugin = require('./index.js');

module.exports = [
  plugin.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: { '@stylistic': stylistic },
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@stylistic/array-bracket-newline': ['error', { multiline: true }],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
        },
      ],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/keyword-spacing': ['error', { before: true }],
      '@stylistic/lines-between-class-members': ['error', 'always'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'any', prev: 'export', next: 'export' },
      ],
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'always' },
      ],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-in-parens': ['error', 'never'],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      'no-unused-vars': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'valid-typeof': 'error',
      curly: ['error', 'all'],
      eqeqeq: 'error',
    },
  },
];
