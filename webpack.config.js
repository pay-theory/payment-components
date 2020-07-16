const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  entry: './src/style.css',
  output: {
    filename: 'style.css',
    path: path.resolve(__dirname, 'dist'),
  },  
  module: {
      rules: [
      {
        test: /\.css$/i,
        use: ['css-loader'],
      },
    ],
  }
}