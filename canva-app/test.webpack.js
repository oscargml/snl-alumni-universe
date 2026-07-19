// Test-only build: exposes the extraction engine on window for the
// browser-based smoke test in the scratchpad. Not part of the shipped app.
const path = require("path");
const webpack = require("webpack");
const base = require("./webpack.config");

module.exports = (env, argv) => {
  const config = base(env, { mode: "development" });
  return {
    ...config,
    entry: path.resolve(__dirname, "src/pdf/extract.ts"),
    output: {
      path: env.outDir ? path.resolve(env.outDir) : path.resolve(__dirname, "dist-test"),
      filename: "extract.js",
      library: { name: "PdfLayers", type: "window" },
      clean: true,
    },
    plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
    devtool: false,
  };
};
