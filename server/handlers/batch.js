/* @flow */
const Promise = require("bluebird");
const _ = require("lodash");

const { notifHandler } = require("hull/lib/utils");
const updateUser = require("../lib/update-user");

const batch = notifHandler({
  userHandlerOptions: {
    groupTraits: true,
    batchSize: 100
  },
  handlers: {
    "user:update": (
      { metric, client, ship }: Object,
      messages: Array<Object> = []
    ) => {
      const concurrency = parseInt(_.get(ship, "private_settings.concurrency", 10), 10);
      client.logger.debug("outgoing.batch.process", {
        messages: messages.length
      });
      return Promise.map(
        messages,
        (message: Object) => {
          return updateUser({ metric, client, ship, isBatch: true }, message);
        },
        {
          concurrency
        }
      );
    }
  }
});

module.exports = batch;
