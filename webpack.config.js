const webpack = require("webpack");
const path = require("path");
const NgAnnotatePlugin = require('ng-annotate-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    entry: './src/main/app/relationships.module.js',
    output: {
        path: __dirname + '/build/app/web/include/relationships',
        filename: 'relationships.module.bundle.js',
    },
    plugins: [
        new NgAnnotatePlugin({add: true}),

        new CopyWebpackPlugin([
            {from: './src/main/app/index.html', target: 'web/include/relationships/index.html'},
            {from: './node_modules/bootstrap/fonts', to: '../fonts'},
            {from: './node_modules/echarts/dist/echarts.js', target: 'web/include/relationships/echarts.js'},
            {from: './node_modules/dagre/dist/dagre.js', target: 'web/include/relationships/dagre.js'}
        ]),

        new BrowserSyncPlugin({
            host: 'localhost',
            port: 3000,
            proxy: 'http://localhost:5516/'
        })
    ],
    module: {
        loaders: [
            {test: /\.js$/, loader: 'babel-loader'}
        ]
    },
    devtool: "#inline-source-map"

}
