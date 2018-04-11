/* @flow */
const Promise = require("bluebird");
const _ = require("lodash");
const Throttle = require("superagent-throttle");

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
      const { private_settings } = ship;
      const throttle = new Throttle({
        rate: private_settings.throttle_rate || 5,
        ratePer: private_settings.throttle_per_rate || 10000,
        concurrent: private_settings.throttle_concurrency || 2
      });

      client.logger.debug("outgoing.batch.process", {
        messages: messages.length
      });
      return Promise.map(messages, (message: Object) => {
        return updateUser(
          { metric, client, ship, isBatch: true, throttle },
          message
        );
      });
    }
  }
});

module.exports = batch;
