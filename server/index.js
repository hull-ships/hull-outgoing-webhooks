import Hull from "hull";

import Server from "./server";
import { name } from "../manifest.json";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: name,
    port: process.env.LOGSTASH_PORT || 1515,
    host: process.env.LOGSTASH_HOST
  });
  Hull.logger.info('logger.start', { transport: 'logstash' });
} else {
  Hull.logger.info('logger.start', { transport: 'console' });
}

const app = new Hull.App({
  port: process.env.PORT || 8082,
  hostSecret: process.env.SECRET || "1234"
});

Server(app.server());

app.start();
