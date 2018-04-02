const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    // The entry points for building page-specific bundles
    entry: {
        vault: "./Content/Js/Vault.ts",
    },
    resolve: {
        // Handlebars npm package is built weirdly: this stops webpack compiler warnings
        alias: {
            handlebars: "handlebars/dist/handlebars.js"
        }
    },
    node: {
        // This is here because Handlebars includes a call to something  
        // which doesn't exist in the browser environment when firing 
        // up it's modules: I don't fully understand this yet...
        fs: "empty"
    }
});
