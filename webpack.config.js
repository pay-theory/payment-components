const path = require('path');
const webpack = require('webpack');
const devtool = 'inline-source-map'
//const devtool = false
module.exports = {
  devtool,
  resolve: {
    extensions: ['.js', '.ts'],
    fallback: {
      util: require.resolve('util/')
    }
  },
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    environment: {
      // The environment supports arrow functions ('() => { ... }').
      arrowFunction: false,
      // The environment supports BigInt as literal (123n).
      bigIntLiteral: false,
      // The environment supports const and let for variable declarations.
      const: false,
      // The environment supports destructuring ('{ a, b } = obj').
      destructuring: false,
      // The environment supports an async import() function to import EcmaScript modules.
      dynamicImport: false,
      // The environment supports 'for of' iteration ('for (const x of array) { ... }').
      forOf: false,
      // The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
      module: false,
    },
  },
  mode: "production",
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
    }, {
      test: /\.svg$/,
      loader: 'svg-inline-loader'
    },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
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
        ENV: JSON.stringify(process.env.ENV),
        STAGE: JSON.stringify(process.env.STAGE),
        TARGET_MODE: JSON.stringify(process.env.TARGET_MODE),
      },
    })
  ],
};
