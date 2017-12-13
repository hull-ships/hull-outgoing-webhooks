import { batchHandler } from "hull/lib/utils";
import updateUser from "../lib/update-user";

const batch = batchHandler(
  ({ metric, client, ship }, messages) => {
    client.logger.debug("outgoing.batch.process", {
      messages: messages.length
    });
    messages.map(m =>
      updateUser({ metric, client, ship, isBatch: true }, m)
    );
  },
  {
    groupTraits: true,
    batchSize: 100
  }
);

export default batch;
