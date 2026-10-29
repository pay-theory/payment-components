/* global require, process, module, __dirname */
const path = require('node:path');
const fields = path.resolve(process.env.SECURE_TAGS_LIB_ROOT || '../secure-tags-lib');
const fromPeer = name => require.resolve(name, { paths: [fields] });
module.exports = {
  root: path.resolve(__dirname, '../..'),
  resolve: { alias: {
    '@': path.join(fields, 'src'),
    'react/jsx-runtime': fromPeer('react/jsx-runtime'),
    react: fromPeer('react'),
    'react-dom/client': fromPeer('react-dom/client'),
    'react-dom/test-utils': fromPeer('react-dom/test-utils'),
    'react-dom': fromPeer('react-dom'),
    '@testing-library/react': fromPeer('@testing-library/react'),
    vitest: path.join(fields, 'node_modules/vitest/dist/index.js'),
  } },
  test: { environment: 'jsdom', include: ['test/cross-repo/*.contract.test.ts'],
    pool: 'forks', fileParallelism: false, globals: false },
};
