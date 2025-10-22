// craco.config.js (CRA v4 / webpack 4)
const path = require("path");
const webpack = require("webpack");

module.exports = {
  webpack: {
    alias: {
      // (kept) Your existing alias for HyperFormula/Chevrotain
      chevrotain: path.resolve(
        __dirname,
        "node_modules/chevrotain/lib/chevrotain.js"
      ),
    },
    configure: (webpackConfig) => {
      // (kept) Let webpack 4 parse .mjs in node_modules
      webpackConfig.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      });

      // ---- NEW: browser-friendly aliases / shims ----
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),

        // Disable node-only modules in browser
        "node:fs": false,
        fs: false,

        // Map node: scheme (and plain names) to browser shims where possible
        "node:https": require.resolve("https-browserify"),
        https: require.resolve("https-browserify"),

        "node:stream": require.resolve("stream-browserify"),
        stream: require.resolve("stream-browserify"),

        "node:buffer": require.resolve("buffer/"),
        buffer: require.resolve("buffer/"),

        "node:util": require.resolve("util/"),
        util: require.resolve("util/"),

        "node:path": require.resolve("path-browserify"),
        path: require.resolve("path-browserify"),

        "node:assert": require.resolve("assert/"),
        assert: require.resolve("assert/"),
      };

      // Provide shims for globals some libs expect
      webpackConfig.plugins = webpackConfig.plugins || [];
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );

      return webpackConfig;
    },
  },
};
