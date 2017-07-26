/* @flow */
import express from "express";
import { smartNotifierHandler, FlowControl } from "hull/lib/utils";
import Promise from "bluebird";

import updateUser from "./lib/update-user";

export default function server(app: express): express {
  app.use("/notify", smartNotifierHandler({
    userHandlerOptions: {
      groupTraits: true
    },
    handlers: {
      "user:update": (ctx, messages) => {
        return Promise.all(messages.map(m => updateUser(ctx, m)))
          .then(() => {
            return new FlowControl({
              type: "next",
              size: process.env.FLOW_CONTROL_SIZE || 10,
              in: process.env.FLOW_CONTROL_SIZE || 1000
            });
          });
      }
    }
  }));
  return app;
}
