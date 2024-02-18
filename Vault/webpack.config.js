const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const { spawn } = require('child_process');

module.exports = {
    output: {
        filename: '[name].min.js',
        path: __dirname + '/wwwroot/js/dist',
        library: 'Vault'
    },
    entry: {
        'Index': './wwwroot/js/src/Index.ts',
        'GenerateVaultCredential': './wwwroot/js/src/GenerateVaultCredential.ts',
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(),
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                    const args = ['run', '--project', '../Utils/Utils.csproj', '--configuration', 'Release', '--', './wwwroot/js/dist', './Views/Home'];

                    const child = spawn('dotnet', args);

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
