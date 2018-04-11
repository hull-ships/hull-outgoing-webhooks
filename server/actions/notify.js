const _ = require("lodash");
const Promise = require("bluebird");
const Throttle = require("superagent-throttle");

const { smartNotifierHandler } = require("hull/lib/utils");

const updateUser = require("../lib/update-user");

const notify = smartNotifierHandler({
  handlers: {
    "user:update": (ctx, messages = []) => {
      const { smartNotifierResponse } = ctx;
      const { private_settings } = ctx.ship;
      const throttle = new Throttle({
        rate: private_settings.throttle_rate || 5,
        ratePer: private_settings.throttle_per_rate || 10000,
        concurrent: private_settings.throttle_concurrency || 2
      });

      // Get 10 users every 100ms at most.
      smartNotifierResponse.setFlowControl({
        type: "next",
        size: 10,
        in: 100
      });
      return Promise.map(messages, message => {
        return updateUser(ctx, message);
      });
    }
  }
});

module.exports = notify;
