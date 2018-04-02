const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    // The entry points for building page-specific bundles
    entry: {
        vault: "./Content/Js/Vault.ts"
    },
    output: {
        library: "Vault"
    }
});
