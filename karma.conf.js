/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = config => {
  config.set(
    merge(createDefaultConfig(config), {
      files: [
        './karma-variables.js',
        './dist/index.js',
        { pattern: 'src/**/*.js', type: 'module' },
        { pattern: 'src/**/**/*.js', type: 'module' },
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        { pattern: config.grep ? config.grep : 'test/**/*.test.js', type: 'module' },
      ],
      coverageReporter: {
        dir: 'build/reports/coverage',
        reporters: [
          { type: 'html', subdir: 'report-html' },
          { type: 'text', subdir: '.' },
        ]
      },
      // see the karma-esm docs for all options
      esm: {
        // if you are using 'bare module imports' you will need this option
        nodeResolve: true,
      },
    }),
  );
  return config;
};
