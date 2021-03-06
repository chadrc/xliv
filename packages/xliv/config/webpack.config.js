const { CheckerPlugin } = require('awesome-typescript-loader');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const EnvFileResolverPlugin = require("env-file-resolver-plugin");
const ComponentFlarePlugin = require("xliv/utils/ComponentFlarePlugin");
const xliv = require("xliv/utils");
const webpack = require("webpack");
const path = require("path");

console.log("Building with webpack.config.js from " + __filename);
console.log("Environment: " + process.env.NODE_ENV);

let isProduction = process.env.NODE_ENV === "production";

let entries = {
    app: "./index.tsx",
    vendor: ["react", "react-dom", "react-flares"]
};

if (!isProduction) {
    entries.patch = 'react-hot-loader/patch';
    entries.client = 'webpack-dev-server/client?http://8080';
    entries.hot = 'webpack/hot/only-dev-server';
} else {
    entries = xliv.addModuleEntries(entries);
}

module.exports = {
    context: path.resolve(process.cwd(), 'app'),

    entry: entries,

    output: {
        filename: "js/[name].bundle.js",
        path: process.cwd() + "/dist",
        publicPath: "/"
    },

    devtool: isProduction ? "source-map" : "eval-source-map",

    resolve: {
        modules: [
            path.resolve(process.cwd(), "app/"),
            "node_modules"
        ],
        extensions: [".ts", ".tsx", ".js"],
        plugins: [
            new EnvFileResolverPlugin()
        ]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    "react-hot-loader/webpack",
                    "awesome-typescript-loader?configFileName=" + xliv.getTsConfig(__dirname)
                ]
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader!sass-loader",
                })
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: "source-map-loader"
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'file-loader?name=[name].[ext]'
                }]
            }
        ]
    },

    plugins: [
        new ComponentFlarePlugin({
            active: isProduction
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new CheckerPlugin(),
        new ExtractTextPlugin('css/[name].bundle.css'),
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
            filename: "js/vendor.bundle.js"
        })
    ],

    devServer: {
        contentBase: path.join(process.cwd(), "dist"),
        compress: isProduction,
        publicPath: "/",
        hot: !isProduction
    }
};
