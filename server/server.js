const { notifHandler, smartNotifierHandler } = require("hull/lib/utils");

const notificationsConfiguration = require("./notifications-configuration");
const { statusHandler } = require("./actions");

function server(app) {
  app.post(
    "/smart-notifier",
    smartNotifierHandler({
      handlers: notificationsConfiguration
    })
  );
  app.use(
    "/batch",
    notifHandler({
      userHandlerOptions: {
        groupTraits: true,
        batchSize: 100
      },
      handlers: notificationsConfiguration
    })
  );
  app.use(
    "/batch-accounts",
    notifHandler({
      accountHandlerOptions: {
        groupTraits: true,
        batchSize: 100
      },
      handlers: notificationsConfiguration
    })
  );
  app.all("/status", statusHandler);

  return app;
}

module.exports = server;
