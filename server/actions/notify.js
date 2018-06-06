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
        size: parseInt(process.env.USER_UPDATE_FLOW_CONTROL_SIZE, 10) || 10,
        in: parseInt(process.env.USER_UPDATE_FLOW_CONTROL_IN, 10) || 100
      });
      return syncAgent.sendUserUpdateMessages(messages);
    }
  }
});

module.exports = notify;
