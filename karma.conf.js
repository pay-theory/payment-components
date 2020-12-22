/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = config => {
  config.set(
    merge(createDefaultConfig(config), {
      files: [
        './karma-variables.js',
        { pattern: 'src/*.js', type: 'module' },
        { pattern: 'src/**/*.js', type: 'module' },
        { pattern: config.grep ? config.grep : 'test/*.test.js', type: 'module' },
      ],
      coverageReporter: {
        dir: 'coverage',
        reporters: [
          { type: 'html', subdir: 'report-html' },
          { type: 'text', subdir: '.' },
          { type: 'lcov', subdir: '.' }
        ]
      },
      plugins: [
        // load plugin
        require.resolve('@open-wc/karma-esm'),
        'karma-*',
      ],

      frameworks: ['esm'],

      esm: {
        // if you are using 'bare module imports' you will need this option
        nodeResolve: true,
      },

      plugins: ['karma-threshold-reporter'],

      reporters: ['progress', 'coverage', 'threshold'],

      // the configure thresholds
      thresholdReporter: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80
      }

    }),
  );
  return config;
};
