const path = require('path');

module.exports = {
  entry: {
    'ze-sip-doorbell-card': './src/ze-sip-doorbell-card.ts'
  },
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js?$/,
        resolve: {
          fullySpecified: false
        },
        use: 'ts-loader'
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};
