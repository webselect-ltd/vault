const ProvidePlugin = require('webpack').ProvidePlugin;
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    // Specify the output file name and location
    output: {
        filename: '[name].js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'Vault'
    },
    entry: {
        'index': './wwwroot/js/index.ts',
        'setdevcookie': './wwwroot/js/setdevcookie.ts',
        'generatevaultcredential': './wwwroot/js/generatevaultcredential.ts',
    },
    // Enable sourcemaps for debugging webpack's output
    devtool: 'source-map',
    plugins: [
        // Remove the output folder before build
        new CleanWebpackPlugin({
            verbose: true
        }),
        // This automatically adds aliases to the application scope for the specified packages
        // So packages which look for the 'jQuery' global alias still work within our app closure
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ],
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
            'handlebars': 'handlebars/dist/handlebars.js'
        }
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader' },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
        ]
    }
};
