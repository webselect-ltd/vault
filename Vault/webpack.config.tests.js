const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.config.common.js");

module.exports = merge(common, {
    entry: {
        tests: "./Content/Js/tests/tests.ts"
    },
    output: {
        library: "Tests"
    },
    externals: {
        mocha: "Mocha",
        chai: "chai"
    }
});
