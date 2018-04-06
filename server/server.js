const { batchHandler, statusHandler, notifyHandler } = require("./handlers");

function server(options = {}) {
  app.post("/smart-notifier", notifyHandler);
  app.use("/batch", batchHandler);
  app.all("/status", statusHandler);

  return app;
}

module.exports = server;
