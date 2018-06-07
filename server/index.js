const Hull = require("hull");
const { devMode } = require("hull/lib/utils");
const express = require("express");

const webpackConfig = require("../webpack.config");
const server = require("./server");
const pkg = require("../package.json");

const {
  SECRET = "1234",
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT = 8082
} = process.env;

const options = {
  hostSecret: SECRET,
  devMode: NODE_ENV === "development",
  port: PORT,
  ngrok: {
    subdomain: pkg.name
  },
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

const connector = new Hull.Connector(options);
const app = express();

if (options.devMode) {
  devMode(app, webpackConfig);
}

connector.setupApp(app);
server(app, options);
connector.startApp(app);
