const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    entry: {
        main: "./Content/Js/main.ts"
    },
    output: {
        library: "Vault"
    }
});
