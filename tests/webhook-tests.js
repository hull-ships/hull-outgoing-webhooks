const assert = require("assert");

import express from "express";
import bodyParser from "body-parser";
import ClientMock from "./client-mock";
import WebHook from "../server/webhook";

const port = 8080;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

describe("Webhook", () => {
  let received;
  const notificationRoute = (req) => {
    req.on('data', (data) => {
      received = data.toString();
    });
  };

  app.post("/notification", notificationRoute);
  app.listen(port);

  it("should send notification", (done) => {
    const requestBody = {
      user: {
        id: "user-1234"
      }
    };
    const webhookConfiguration = {
      webhooks_urls: ["http://localhost:8080/notification"],
      hull: ClientMock(),
      payload: requestBody
    };

    WebHook(webhookConfiguration);
    setTimeout(() => {
      assert.equal(received, JSON.stringify(requestBody));
      done();
    }, 100);
  });
});
