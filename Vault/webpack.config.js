var webpack = require("webpack");

module.exports = {
    // The entry points for building page-specific bundles
    entry: {
        vault: "./Content/Js/Vault.ts",
        tests: "./Content/Js/test/tests.ts"
    },
    
    output: {
        filename: "[name].js",
        path: __dirname + "/Content/Js/dist",
        // Assigns the module output to a global variable
        // You can use substitutions in the library name as well
        // library: "[name]"
        library: "Vault"
    },

    // Enable sourcemaps for debugging webpack's output
    devtool: "source-map",

    plugins: [
        // This automatically adds aliases to the application scope for the specified packages
        // So packages which look for the 'jQuery' global alias still work within our app closure
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        })
    ],

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
        // Handlebars npm package is built weirdly: this stops webpack compiler warnings
        alias: {
            handlebars: "handlebars/dist/handlebars.js"
        }
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'
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
         jquery: "jQuery"
    },

    node: {
        // This is here because Handlebars includes a call to something  
        // which doesn't exist in the browser environment when firing 
        // up it's modules: I don't fully understand this yet...
        fs: "empty"
    }
};
