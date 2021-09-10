const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const { spawn } = require('child_process');

module.exports = {
    output: {
        filename: '[name].min.js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'Vault'
    },
    entry: {
        'index': './wwwroot/js/src/index.ts',
        'generatevaultcredential': './wwwroot/js/src/generatevaultcredential.ts',
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(),
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                    const child = spawn('dotnet', ['run', '-p', '../Utils/Utils.csproj', './wwwroot/js/dist', './Views/Home']);

                    child.stdout.on('data', function (data) {
                        process.stdout.write(data.toString());
                    });

                    child.stderr.on('data', function (data) {
                        process.stdout.write(data.toString());
                    });
                });
            }
        }
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            'handlebars': 'handlebars/dist/handlebars.js'
        }
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};
