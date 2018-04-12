const _ = require("lodash");
const Promise = require("bluebird");

const { smartNotifierHandler } = require("hull/lib/utils");

const SyncAgent = require("../lib/sync-agent");

const notify = smartNotifierHandler({
  handlers: {
    "user:update": (ctx, messages = []) => {
      const { smartNotifierResponse } = ctx;
      const syncAgent = new SyncAgent(ctx);
      // Get 10 users every 100ms at most.
      smartNotifierResponse.setFlowControl({
        type: "next",
        size: 10,
        in: 100
      });
      return Promise.map(messages, message => {
        return syncAgent.updateUser(message);
      });
    }
  }
});

module.exports = notify;
