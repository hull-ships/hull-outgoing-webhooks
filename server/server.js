const { batchHandler, statusHandler, notifyHandler } = require("./actions");

function server(app) {
  app.post("/smart-notifier", notifyHandler);
  app.use("/batch", batchHandler);
  app.all("/status", statusHandler);

  return app;
}

module.exports = server;
