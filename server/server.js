import jwt from "jwt-simple";
import express from "express";
import path from "path";
import { renderFile } from "ejs";
import updateUser from "./update-user";

module.exports = function Server(options = {}) {
  const { port, hostSecret, Hull } = options;
  const { NotifHandler, BatchHandler, Routes, Middleware: hullClient } = Hull;
  const { Readme, Manifest } = Routes;

  const app = express();
  app.engine("html", renderFile);
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.post('/notify', NotifHandler({
    hostSecret,
    groupTraits: true,
    onError: (message, status) => console.warn("Error", status, message),
    handlers: {
      "user:update": updateUser
    }
  }));

  app.post("/batch", BatchHandler({
    hostSecret,
    groupTraits: true,
    batchSize: 100,
    handler: (notifications = [], { hull, ship }) => {
      hull.logger.debug("batch.process", { notifications: notifications.length });
      notifications.map(({ message }) => updateUser({ message }, { hull, ship, isBatch: true }));
    }
  }));

  Hull.logger.info("started", { port });
  app.listen(port);
  return app;
};
