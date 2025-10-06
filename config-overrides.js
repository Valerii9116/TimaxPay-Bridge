const webpack = require('webpack');

module.exports = function override(config) {
    // --- FIX FOR THE ORIGINAL BUILD ERROR ---
    // These lines enable experimental support for outputting ES Modules,
    // which is what the error message suggested.
    config.output.module = true;
    config.experiments = { ...config.experiments, outputModule: true };
    // -----------------------------------------

    // --- YOUR NODE.JS POLYFILLS ---
    // This section provides browser-compatible versions of Node.js core modules.
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "url": require.resolve("url"),
    });
    config.resolve.fallback = fallback;

    // This section provides global access to 'process' and 'Buffer' for dependencies
    // that expect them to be available.
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);
    // -----------------------------------

    // This rule helps Webpack correctly resolve .mjs files.
    config.module.rules.push({
        test: /\.m?js/,
        resolve: {
            fullySpecified: false,
        },
    });

    // Ignores noisy but usually harmless source map warnings.
    config.ignoreWarnings = [/Failed to parse source map/];

    return config;
}

