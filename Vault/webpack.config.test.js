const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    // The entry points for building page-specific bundles
    entry: {
        tests: "./Content/Js/test/tests.ts"
    },
    module: {
        rules: [
            // Bootstrap modules will be globally available so don't compile them into the bundle
            { test: /bootstrap/, loader: "null-loader" }
        ]
    },
    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between build
    externals: {
        handlebars: "Handlebars",
        "js-cookie": "Cookies"
    }
});
