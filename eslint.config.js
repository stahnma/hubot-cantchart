'use strict'

const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: globals.mocha
    }
  }
]
