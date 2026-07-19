const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => ({
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".mjs"],
  },
  module: {
    rules: [
      {
        // Inline the pdf.js worker as a string so the app ships as a single
        // bundle (Canva production apps are uploaded as one app.js file).
        test: /pdf\.worker(\.min)?\.mjs$/,
        type: "asset/source",
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  // Canva production apps are uploaded as a single app.js — fold every
  // dynamically imported chunk into the main bundle.
  plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  devtool: argv.mode === "production" ? false : "source-map",
  devServer: {
    port: 8080,
    host: "localhost",
    // Canva's editor loads the bundle cross-origin during development.
    headers: { "Access-Control-Allow-Origin": "*" },
    static: false,
    hot: false,
    liveReload: false,
    client: false,
  },
});
