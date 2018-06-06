/* @flow */
const { notifHandler } = require("hull/lib/utils");
const SyncAgent = require("../lib/sync-agent");

const batch = notifHandler({
  userHandlerOptions: {
    groupTraits: true,
    batchSize: 100
  },
  handlers: {
    "user:update": (ctx: Object, messages: Array<Object> = []) => {
      const syncAgent = new SyncAgent(ctx, { isBatch: true });

      ctx.client.logger.debug("outgoing.batch.process", {
        messages: messages.length
      });
      return syncAgent.sendUserUpdateMessages(messages);
    }
  }
});

module.exports = batch;
