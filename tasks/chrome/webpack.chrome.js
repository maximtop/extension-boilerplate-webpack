const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const chromeManifestDiff = require('./manifest.chrome');

const CHROME_PATH = 'chrome';

const chromeConfig = {
  output: {
    ...common.output,
    path: path.join(common.output.path, CHROME_PATH),
  },
  plugins: [
    ...common.plugins,
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../manifest.common.json'),
        to: 'manifest.json',
        // eslint-disable-next-line no-shadow, no-unused-vars
        transform: (content, path) => updateManifest(content, chromeManifestDiff),
      },
    ]),
  ],
};

module.exports = merge(common, chromeConfig);
