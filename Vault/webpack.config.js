const ProvidePlugin = require('webpack').ProvidePlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    // Specify the output file name and location
    output: {
        filename: '[name].js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'Vault'
    },
    entry: {
        'main': './wwwroot/js/main.ts'
    },
    // Enable sourcemaps for debugging webpack's output
    devtool: 'source-map',
    plugins: [
        // Remove the output folder before build
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: ['!**/external/*.js'],
        }),
        // This automatically adds aliases to the application scope for the specified packages
        // So packages which look for the 'jQuery' global alias still work within our app closure
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        // Copy the external dependencies into the output folder
        new CopyWebpackPlugin([
            { from: 'node_modules/jquery/dist/jquery.js', to: 'external' },
            { from: 'node_modules/handlebars/dist/handlebars.js', to: 'external' },
            { from: 'node_modules/js-cookie/src/js.cookie.js', to: 'external' },
            { from: 'node_modules/bootstrap/js/modal.js', to: 'external' }
        ],)
    ],
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader' },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
        ]
    },
    // When importing a module whose path matches one of the following keys, just
    // assume a global variable named <value> exists and use that instead
    externals: {
        jquery: 'jQuery',
        handlebars: 'Handlebars',
        'js-cookie': 'Cookies'
    }
};
