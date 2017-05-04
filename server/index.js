/* @flow */
import Hull from "hull";
import express from "express";

import Server from "./server";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const connector = new Hull.Connector({
  port: process.env.PORT || 8082,
  hostSecret: process.env.SECRET || "1234"
});
const app = express();
connector.setupApp(app);

Server(app);

connector.startApp(app);
