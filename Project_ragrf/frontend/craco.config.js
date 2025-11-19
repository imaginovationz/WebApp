// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (config) => {
      // --- Ensure objects exist (FIXED: added "..." spreads) ---
      config.resolve = config.resolve || {};
      config.resolve.fallback = { ...(config.resolve.fallback || {}) };
      config.resolve.alias = { ...(config.resolve.alias || {}) };

      // --- Standard browser fallbacks (keep fs:false) ---
      Object.assign(config.resolve.fallback, {
        fs: false, // never bundle fs in the browser
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        url: require.resolve("url/"),
        zlib: require.resolve("browserify-zlib"),
        util: require.resolve("util/"),
        os: require.resolve("os-browserify/browser"),
        vm: require.resolve("vm-browserify"),
      });

      // --- Alias node:* specifiers + process/browser path ---
      Object.assign(config.resolve.alias, {
        "node:fs": false,
        "node:path": require.resolve("path-browserify"),
        "node:stream": require.resolve("stream-browserify"),
        "node:buffer": require.resolve("buffer/"),
        "node:http": require.resolve("stream-http"),
        "node:https": require.resolve("https-browserify"),
        "node:url": require.resolve("url/"),
        "node:zlib": require.resolve("browserify-zlib"),
        "node:util": require.resolve("util/"),

        // make the prior error go away and stay away
        "process/browser": require.resolve("process/browser.js"),

        // keep axios on the browser path
        "follow-redirects": false,
      });

      // --- Plugins: provide globals + STRIP the "node:" scheme ---
      config.plugins = config.plugins || [];
      config.plugins.push(
        // 1) global shims expected by many libs
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.DefinePlugin({
          "process.env": "{}", // minimal env object
        }),
        // 2) CRITICAL: turn "node:https" -> "https", "node:fs" -> "fs", etc.
        // so the alias/fallbacks above can kick in before Webpack tries to "read" the scheme.
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );

      return config;
    },
  },
};