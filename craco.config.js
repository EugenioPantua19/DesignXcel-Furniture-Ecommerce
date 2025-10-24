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
