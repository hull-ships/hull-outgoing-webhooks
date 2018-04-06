const _ = require("lodash");
const Promise = require("bluebird");
const { smartNotifierHandler } = require("hull/lib/utils");

const updateUser = require("../lib/update-user");

const notify = smartNotifierHandler({
  handlers: {
    "user:update": (ctx, messages = []) => {
      const { smartNotifierResponse } = ctx;
      const concurrency = parseInt(_.get(ctx, "ship.private_settings.concurrency", 10), 10);
      if (_.isNaN(concurrency)) {
        concurrency = 10;
      }
      // Get 10 users every 100ms at most.
      smartNotifierResponse.setFlowControl({
        type: "next",
        size: 10,
        in: 100
      });
      return Promise.map(
        messages,
        message => {
          return updateUser(ctx, message);
        },
        {
          concurrency
        }
      );
    }
  }
});

module.exports = notify;
