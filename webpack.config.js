const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const pJson = require('./package.json');

const ENV_MAP = {
  development: { outputPath: 'dev', name: 'Dev' },
  beta: { outputPath: 'beta', name: 'Beta' },
  release: { outputPath: 'release', name: '' },
};
const SRC_PATH = 'src';
const BACKGROUND_PATH = path.join(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.join(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.join(__dirname, SRC_PATH, 'popup');
const CONTENT_SCRIPTS_PATH = path.join(__dirname, SRC_PATH, 'content-scripts');
const LOCALES_PATH = path.join(__dirname, SRC_PATH, '_locales/en/messages');

const IS_DEV = process.env.NODE_ENV === 'development';

const getOutputPathByEnv = (env) => {
  const envData = ENV_MAP[env];
  if (!envData) {
    throw new Error(`Wrong environment: ${env}`);
  }
  return envData.outputPath;
};

const BUILD_PATH = 'build';
const OUTPUT_PATH = getOutputPathByEnv(process.env.NODE_ENV);

const getNameByEnv = (env) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const locales = require(LOCALES_PATH);
  if (!locales) {
    throw new Error(`Wrong path to locales ${LOCALES_PATH}`);
  }
  const { name } = locales;

  const envData = ENV_MAP[env];
  if (!envData) {
    throw new Error(`Wrong environment: ${env}`);
  }

  return `${name.message} ${envData.name}`;
};

const updateManifest = (content) => {
  const manifest = JSON.parse(content.toString());
  const devPolicy = IS_DEV ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {};
  const name = getNameByEnv(process.env.NODE_ENV);
  const updatedManifest = {
    ...manifest,
    ...devPolicy,
    name,
    version: pJson.version,
  };
  return Buffer.from(JSON.stringify(updatedManifest, null, 2));
};

const config = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'cheap-module-eval-source-map' : false,
  optimization: {
    minimize: false,
  },
  entry: {
    background: BACKGROUND_PATH,
    options: OPTIONS_PATH,
    popup: POPUP_PATH,
    'content-scripts': CONTENT_SCRIPTS_PATH,
  },
  output: {
    path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: { babelrc: true },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'manifest.json',
        context: 'src',
        // eslint-disable-next-line no-shadow, no-unused-vars
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
