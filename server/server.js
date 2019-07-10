const { smartNotifierHandler } = require("hull/lib/utils");

const notificationsConfiguration = require("./notifications-configuration");
const { statusHandler } = require("./actions");

function server(app) {
  app.post(
    "/smart-notifier",
    smartNotifierHandler({
      handlers: notificationsConfiguration
    })
  );
  app.all("/status", statusHandler);

  return app;
}

module.exports = server;
