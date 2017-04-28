/* @flow */
import express from "express";
import { notifHandler, batchHandler } from "hull/lib/utils";

import updateUser from "./update-user";

module.exports = function Server(app: express) {
  app.use('/notify', notifHandler({
    userHandlerOptions: {
      groupTraits: true
    },
    handlers: {
      "user:update": (ctx, messages) => {
        messages.map(m => updateUser(ctx, m));
      }
    }
  }));

  app.use("/batch", batchHandler(({ metric, client, ship }, messages) => {
    client.logger.debug("batch.process", { messages: messages.length });
    messages.map((message) => {
      return updateUser({ metric, client, ship, isBatch: true }, message);
    });
  }, {
    groupTraits: true,
    batchSize: 100
  }));

  return app;
};
