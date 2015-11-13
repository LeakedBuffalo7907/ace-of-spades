module.exports = {
  context: __dirname + "/client/src",
  entry: "./main",
  module: {
    loaders: [
      {
        test: /\.es6?$/,
        loader: 'babel'
      }
    ]
  },
  output: {
      path: __dirname + "/server/public/client/",
      filename: "bundle.js"
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js", ".es6"]
  }
};
