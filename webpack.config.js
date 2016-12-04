var glob = require('glob');

module.exports = {
  entry: glob.sync('./src/**/*.ts'),
  output: {
    path: 'docs',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '', '.webpack.js', '.web.js', '.js']
  },
  devtool: 'source-map',
  devServer: {
    contentBase: 'docs'
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|web_modules)/,
        loader: 'ts-loader'
      }
    ]
  }
};