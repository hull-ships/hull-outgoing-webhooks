import Promise from "bluebird";
import { smartNotifierHandler } from "hull/lib/utils";
import updateUser from "../lib/update-user";

const notify = smartNotifierHandler({
  handlers: {
    "user:update": (ctx, messages = []) => {
      const { smartNotifierResponse, metric } = ctx;
      // Get 10 users every 100ms at most.
      smartNotifierResponse.setFlowControl({
        type: "next",
        size: 10,
        in: 100
      });
      const upd = updateUser.bind(undefined, ctx);
      return Promise.all(messages.map(upd));
    }
  }
});

export default notify;
