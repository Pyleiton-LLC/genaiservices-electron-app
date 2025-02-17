const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/preload.js',
  target: 'electron-preload',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.bundle.js',
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};