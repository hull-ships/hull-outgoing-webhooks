const SyncAgent = require("./lib/sync-agent");

module.exports = {
  "user:update": (ctx, messages = []) => {
    const scope = "user";
    const syncAgent = new SyncAgent(ctx, scope);
    if (ctx.smartNotifierResponse) {
      // Get 10 users every 100ms at most.
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: parseInt(process.env.USER_UPDATE_FLOW_CONTROL_SIZE, 10) || 10,
        in: parseInt(process.env.USER_UPDATE_FLOW_CONTROL_IN, 10) || 100
      });
    }
    return syncAgent.sendUpdateMessages(ctx, "user", messages);
  },
  "account:update": (ctx, messages = []) => {
    const scope = "account";
    const syncAgent = new SyncAgent(ctx, scope);
    if (ctx.smartNotifierResponse) {
      ctx.smartNotifierResponse.setFlowControl({
        type: "next",
        size: parseInt(process.env.ACCOUNT_UPDATE_FLOW_CONTROL_SIZE, 10) || 10,
        in: parseInt(process.env.ACCOUNT_UPDATE_FLOW_CONTROL_IN, 10) || 100
      });
    }
    return syncAgent.sendUpdateMessages(ctx, "account", messages);
  }
};
