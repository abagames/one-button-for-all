var glob = require('glob');
var ob = glob.sync('./src/ob/**/*.ts');

module.exports = {
  entry: {
    ob: ob,
    refrev: ['./src/refrev/index.ts'].concat(ob),
    invorb: ['./src/invorb/index.ts'].concat(ob),
    ropes: ['./src/ropes/index.ts'].concat(ob),
    imball: ['./src/imball/index.ts'].concat(ob)
  },
  output: {
    path: 'docs',
    filename: '[name]/index.js',
    library: ['[name]'],
    libraryTarget: 'umd'
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
        loader: 'awesome-typescript-loader'
      }
    ]
  }
};