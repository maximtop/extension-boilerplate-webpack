const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const pJson = require('./package.json');

const SRC_PATH = 'src';
const BACKGROUND_PATH = path.join(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.join(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.join(__dirname, SRC_PATH, 'popup');
const CONTENT_SCRIPTS_PATH = path.join(__dirname, SRC_PATH, 'content-scripts');

const IS_DEV = process.env.NODE_ENV === 'development';

// Here you can change your manifest file before copying it
const updateManifest = (content) => {
  const manifest = JSON.parse(content.toString());
  const devPolicy = IS_DEV ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {};
  const updatedManifest = {
    ...manifest,
    ...devPolicy,
    version: pJson.version,
  };
  return Buffer.from(JSON.stringify(updatedManifest, null, 2));
};

const config = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'cheap-module-eval-source-map' : false,
  entry: {
    background: BACKGROUND_PATH,
    options: OPTIONS_PATH,
    popup: POPUP_PATH,
    'content-scripts': CONTENT_SCRIPTS_PATH,
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'manifest.json',
        context: 'src',
        transform: (content, path) => updateManifest(content),
      },
      {
        context: 'src',
        from: 'assets/',
        to: 'assets/',
      },
      {
        context: 'src',
        from: '_locales/',
        to: '_locales/',
      },
    ]),
    new HtmlWebpackPlugin({
      template: path.join(BACKGROUND_PATH, 'index.html'),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(OPTIONS_PATH, 'index.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(POPUP_PATH, 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
  ],
};

module.exports = config;
