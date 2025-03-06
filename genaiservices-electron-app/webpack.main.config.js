const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/app.js',
  target: 'electron-main',
  externals: [nodeExternals()],
  output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'app.bundle.js',
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/preload.js', to: 'preload.js' }, 
                { from: 'src/webview-preload.js', to: 'webview-preload.js' },
                { from: 'config/genai-config.json', to: 'config/genai-config.json' }
            ],
        }),
    ],
};