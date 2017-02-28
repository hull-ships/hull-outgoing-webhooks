import _ from "lodash";
import { notifHandler, batchHandler } from "hull/lib/utils";

import updateUser from "./update-user";

module.exports = function Server(app) {
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

  app.use("/batch", batchHandler(({ metric, segments, client, ship }, users = []) => {
    client.logger.debug("batch.process", { users: users.length });
    const filtered = users.filter(u => client.filterUserSegments(u));
    client.logger.debug("batch.process.filtered", { notifications: filtered.length });
    filtered.map((user) => {
      const message = {
        user,
        segments: user.segment_ids.map(id => _.find(segments, { id }))
      };
      return updateUser({ metric, client, ship, isBatch: true }, message);
    });
  }, {
    groupTraits: true,
    batchSize: 100,
  }));

  return app;
};
