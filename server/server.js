import express from "express";
import path from "path";
import { renderFile } from "ejs";
import filterUserSegments from "./filter-user-segments";
import updateUser from "./update-user";

module.exports = function Server(options = {}) {
  const { port, hostSecret, Hull, instrumentationAgent } = options;
  const { NotifHandler, BatchHandler, Routes } = Hull;
  const { Readme, Manifest } = Routes;

  const app = express();
  app.engine("html", renderFile);
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));
  app.use(instrumentationAgent.metricMiddleware);
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
    handler: (notifications = [], { req, hull, ship }) => {
      hull.logger.debug("batch.process", { notifications: notifications.length });
      const filtered = notifications.filter(filterUserSegments.bind(null, { ship }));
      hull.logger.debug("batch.process.filtered", { notifications: filtered.length });
      filtered.map(({ message }) => updateUser({ message }, { req, hull, ship, isBatch: true }));
    }
  }));

  Hull.logger.info("started", { port });
  app.listen(port);
  return app;
};
