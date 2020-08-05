const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    }, ],
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true),
      VERSION: JSON.stringify('5fa3b9'),
      BROWSER_SUPPORTS_HTML5: true,
      TWO: '1+1',
      'typeof window': JSON.stringify('object'),
      'process.env': {
        BUILD_ENV: JSON.stringify(process.env.BUILD_ENV),
        APP_ID: JSON.stringify(process.env.APP_ID),
      },
    }),
  ],
};
