#!/usr/bin/env node
import {Arguments} from "./Arguments";
import {componentCommand, exposeCommand, moduleCommand, projectCommand} from "./commands";

const fs = require("fs");
const spawn = require("child_process").spawn;

function makeWebpackArgs(existingArgs: string[]): string[] {
    if (existingArgs.indexOf("--config") === -1) {
        let webpackConfig = "./node_modules/xliv/config/webpack.config.js";
        try {
            let cwdConfig = `${process.cwd()}/webpack.config.js`;
            fs.readFileSync(cwdConfig);
            // No error means file exists
            webpackConfig = cwdConfig;
        } catch (e) {
            console.log("No local config. Using defaults.");
        }
        existingArgs.unshift("--config", webpackConfig);
    }
    return existingArgs;
}

function execute(cmd: string, env: string, options: string[], callback: (code: number) => void) {
    if (!options) {
        options = []
    }
    options.unshift(`NODE_ENV=${env}`, `./node_modules/.bin/${cmd}`);
    const webpack = spawn(`./node_modules/.bin/cross-env`, options);
    webpack.stdout.on("data", (data: BufferSource) => {
        console.log(data.toString());
    });

    webpack.stderr.on("data", (data: BufferSource) => {
        console.error(data.toString());
    });

    webpack.on("close", (code: number) => {
        callback(code);
    });
}

const settings = require('../package.json');

let args = new Arguments(process.argv);
args.skip(2); // skip node executable and command name

if (args.isEmpty) {
    console.log('No Arguments Given');
} else {
    let command = args.next();

    try {
        switch (command) {
            case "component":
                let componentPath = args.next();
                componentCommand(componentPath, args.noView, args.noTypes, args.noStyles, args.makeFlare);
                break;

            case "module":
                let moduleName = args.next();
                moduleCommand(moduleName, args.noStyles, args.noTypes, args.noView);
                break;

            case "project":
                let appName = args.next();
                projectCommand(appName, settings.version,
                    args.noModule, args.noStyles, args.noView, args.noTypes);
                break;

            case "build":
                let buildEnv = args.development ? "development" : "production";
                if (args.env) {
                    buildEnv = args.env;
                }
                execute("webpack", buildEnv, makeWebpackArgs(args.argv), (code) => {
                    console.log(`build exited with code ${code}`);
                });
                break;

            case "start":
                let startEnv = "development";
                if (args.env) {
                    startEnv = args.env;
                    if (startEnv === "production") {
                        console.error("The start command is no supported in a production environment.");
                        break;
                    }
                }
                execute("webpack-dev-server", startEnv, makeWebpackArgs(args.argv), (code) => {
                    console.log(`start exited with code ${code}`);
                });
                break;

            case "expose":
                exposeCommand(args.tsOnly);
                break;

            default:
                console.error("No such command: " + command);
        }
    } catch (e) {
        console.error(e);
    }
}