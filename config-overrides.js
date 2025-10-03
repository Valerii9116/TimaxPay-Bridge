const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "url": require.resolve("url"),
        "process": require.resolve("process/browser"),
        "process/browser": require.resolve("process/browser"),
    });
    config.resolve.fallback = fallback;

    // Add this to handle fully specified ESM imports
    config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts'],
    };

    // Make sure webpack resolves .mjs files
    config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
            fullySpecified: false,
        },
    });

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);

    config.ignoreWarnings = [/Failed to parse source map/];
    
    return config;
}