/* @flow */
import express from "express";
import { smartNotifierHandler } from "hull/lib/utils";
import Promise from "bluebird";

import updateUser from "./lib/update-user";

export default function server(app: express): express {
  app.use("/notify", smartNotifierHandler({
    userHandlerOptions: {
      groupTraits: true
    },
    handlers: {
      "user:update": (ctx, messages) => {
        // default flow control
        ctx.smartNotifierResponse
          .setFlowControl({
            type: "next",
            size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 10,
            in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1000
          });
        return Promise.all(messages.map(m => updateUser(ctx, m)));
      }
    }
  }));
  return app;
}
