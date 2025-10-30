module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "util": require.resolve("util/"),
        "zlib": require.resolve("browserify-zlib"),
        "stream": require.resolve("stream-browserify"),
        "url": require.resolve("url/"),
        "crypto": require.resolve("crypto-browserify"),
        "assert": require.resolve("assert/")
      };
      
      // Exclude @google/model-viewer from webpack bundling since it's loaded dynamically via CDN
      // This prevents the AgXToneMapping import error from Three.js version mismatch
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        '@google/model-viewer': false // Prevent webpack from trying to bundle model-viewer
      };
      
      // Use IgnorePlugin to completely ignore model-viewer during bundling
      const webpack = require('webpack');
      webpackConfig.plugins = webpackConfig.plugins || [];
      webpackConfig.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@google\/model-viewer$/,
        })
      );
      
      // Disable ESLint during build to avoid plugin issues
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );
      
      return webpackConfig;
    }
  },
  eslint: {
    enable: false
  }
};
