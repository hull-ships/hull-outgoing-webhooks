import express from "express";
import bodyParser from "body-parser";
import ClientMock from "./client-mock";
import Webhook from "../server/webhook";

const assert = require("assert");

const port = 8070;
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
      webhooks_urls: ["http://localhost:8070/notification"],
      hull: ClientMock(),
      payload: requestBody
    };

    Webhook(webhookConfiguration);
    setTimeout(() => {
      assert.equal(received, JSON.stringify(requestBody));
      done();
    }, 100);
  });
});
