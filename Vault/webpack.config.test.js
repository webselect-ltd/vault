const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    // The entry points for building page-specific bundles
    entry: {
        tests: "./Content/Js/test/tests.ts"
    },
    externals: {
        mocha: "mocha",
        chai: "chai"
    }
});
