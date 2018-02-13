/* @flow */

import { notifHandler } from "hull/lib/utils";
import updateUser from "../lib/update-user";

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
      client.logger.debug("outgoing.batch.process", {
        messages: messages.length
      });
      messages.map(m => updateUser({ metric, client, ship, isBatch: true }, m));
    }
  }
});

export default batch;
