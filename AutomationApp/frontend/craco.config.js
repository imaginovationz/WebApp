// craco.config.js (additions marked)
const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  webpack: {
    configure: (config) => {
      // --- existing fallback/alias (keep yours) ---
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        url: require.resolve("url/"),
        zlib: require.resolve("browserify-zlib"),
        assert: require.resolve("assert/"),
        util: require.resolve("util/")
      };

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "node:fs": false,
        "node:path": require.resolve("path-browserify"),
        "node:stream": require.resolve("stream-browserify"),
        "node:buffer": require.resolve("buffer/"),
        "node:http": require.resolve("stream-http"),
        "node:https": require.resolve("https-browserify"),
        "node:url": require.resolve("url/"),
        "node:zlib": require.resolve("browserify-zlib"),
        "node:assert": require.resolve("assert/"),
        "node:util": require.resolve("util/")
      };

      config.plugins = config.plugins || [];

      // [ADD THIS] Strip the "node:" scheme before Webpack tries to read it
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );

      // keep your existing plugins
      config.plugins.push(
        new NodePolyfillPlugin(),
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser"
        })
      );

      return config;
    }
  }
};
