const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    target: 'node',
    externals: [nodeExternals()], // removes node_modules from your final bundle
    entry: './src/index.ts', // make sure this matches the main root of your code 
    output: {
        path: path.join(__dirname, 'dist'), // this can be any path and directory you want
        filename: 'index.js',
    },
    optimization: {
        minimize: true, // enabling this reduces file size and readability
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    }
};