const webpack = require("webpack");
const ProvidePlugin = require("webpack").ProvidePlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    output: {
        filename: "[name].js",
        path: __dirname + "/Content/Js/dist"
    },
    // Enable sourcemaps for debugging webpack's output
    devtool: "source-map",
    plugins: [
        // Remove the output folder before build
        // new CleanWebpackPlugin(['Content/Js/dist']),
        // This automatically adds aliases to the application scope for the specified packages
        // So packages which look for the 'jQuery' global alias still work within our app closure
        new ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        // Copy the external dependencies into the output folder
        new CopyWebpackPlugin([
            { from: 'node_modules/jquery/dist/jquery.min.js', to: 'vendor' },
            { from: 'node_modules/handlebars/dist/handlebars.min.js', to: 'vendor' },
            { from: 'node_modules/js-cookie/src/js.cookie.js', to: 'vendor' },
            { from: 'node_modules/bootstrap/js/modal.js', to: 'vendor' }
        ])
    ],
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, loader: "ts-loader" },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },
    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between build
    externals: {
        jquery: "jQuery",
        handlebars: "Handlebars",
        "js-cookie": "Cookies"
    }
};
