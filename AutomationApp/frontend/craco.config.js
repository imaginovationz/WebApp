// craco.config.js (CRA v4 / Webpack 4)
const webpack = require("webpack");

module.exports = {
  webpack: {
    // ⛔️ remove the 'alias' section entirely (especially 'chevrotain')
    configure: (webpackConfig) => {
      // 1) Remove any accidental "node:*" aliases
      if (webpackConfig.resolve && webpackConfig.resolve.alias) {
        const badKeys = Object.keys(webpackConfig.resolve.alias).filter((k) =>
          k.startsWith("node:")
        );
        for (const k of badKeys) delete webpackConfig.resolve.alias[k];
      }

      // 2) Webpack 4 way to disable fs in the browser
      webpackConfig.node = {
        ...(webpackConfig.node || {}),
        fs: "empty",
      };

      // 3) Parse .mjs in node_modules correctly (needed for ESM deps)
      webpackConfig.module = webpackConfig.module || {};
      webpackConfig.module.rules = webpackConfig.module.rules || [];
      const hasMjsRule = webpackConfig.module.rules.some(
        (r) => String(r.test) === String(/\.mjs$/)
      );
      if (!hasMjsRule) {
        webpackConfig.module.rules.unshift({
          test: /\.mjs$/,
          include: /node_modules/,
          type: "javascript/auto",
        });
      }

      // 4) Prefer ESM entry points when available
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.mainFields = ["es2015", "module", "browser", "main"];

      // 5) Provide globals expected by some libs (buffer/process)
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: ["process"],
        }),
      ];

      return webpackConfig;
    },
  },
};
