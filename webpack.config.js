const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'none',
  module: {
    rules: [{
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                "useBuiltIns": "usage",
                "modules": "auto",
                "corejs": "3.6.5",
                "targets": {
                  "ie": "11"
                }
              }
            ]
          ],
          plugins: ["@babel/plugin-transform-modules-commonjs", "@babel/plugin-transform-classes"]
        }
      }
    }, {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    }],
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
