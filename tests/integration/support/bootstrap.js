const express = require("express");
const Hull = require("hull");
const server = require("../../../server/server");

module.exports = function bootstrap(timeout = 25000) {
  const hostSecret = "1234";
  const app = express();
  const connector = new Hull.Connector({
    hostSecret, port: 8000, skipSignatureValidation: true, timeout, clientConfig: { protocol: "http", firehoseUrl: "firehose" }
  });
  connector.setupApp(app);
  server(app, {
    Hull,
    hostSecret
  });
  return connector.startApp(app);
};
