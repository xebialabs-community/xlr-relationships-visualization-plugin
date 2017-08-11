var webpack = require("webpack");
var path = require("path");
var NgAnnotatePlugin = require('ng-annotate-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJS = require("uglify-js");
const minify = (content) => UglifyJS.minify(String(content), {mangle: false}).code;

module.exports = {
    entry: ['./src/main/app/relationships.module.js'],
    output: {
        path: __dirname + '/build/app/web/include/relationships',
        filename: 'relationships.module.bundle.js',
    },
    plugins: [
            new NgAnnotatePlugin({ add: true }),

            new CopyWebpackPlugin([
                { from: './src/main/app/index.html', target: 'web/include/relationships/index.html'},
                {from: './node_modules/echarts/dist/echarts.js', target: 'web/include/relationships/echarts.js', transform: minify},
                {from: './node_modules/dagre/dist/dagre.js', target: 'web/include/relationships/dagre.js', transform: minify}
            ]),

            new webpack.optimize.UglifyJsPlugin({
                mangle: false,
                compress: { warnings: false }
            })
    ],
    module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
      ]
    }
};
