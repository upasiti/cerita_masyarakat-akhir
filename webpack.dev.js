const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3000, // ganti 9000 → 3000
    open: true, // otomatis buka browser
    historyApiFallback: true, // untuk dukung SPA tanpa error 404
    client: {
      overlay: {
        errors: true,
        warnings: false, // biar gak ganggu tampilan
      },
    },
  },
});
