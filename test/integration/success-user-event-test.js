const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");
const _ = require("lodash");
const bootstrap = require("./support/bootstrap");
const examplePayload = require("../fixtures/user-event");

describe("user test - attribute change", () => {
  let minihull;
  let server;
  let externalApi;

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap({ port: 8040, timeout: 250000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_ok").respond((req, res) => {
      setTimeout(() => {
        res.end("ok");
      }, 100);
    });

    return Promise.all([minihull.listen(8061), externalApi.listen(8041)]);
  });

  afterEach(done => {
    server.close(() => {
      Promise.all([minihull.close(), externalApi.close()]).then(() => done());
    });
  });

  it(
    "should return next",
    function() {
      examplePayload.connector.private_settings.webhooks_urls = [
        "http://localhost:8041/endpoint_ok"
      ];
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8040/smart-notifier",
          "user:update",
          examplePayload.messages
        )
        .then(
          res => {
            const firstSentPayload = externalApi.requests
              .get("incoming.0")
              .value();
            const secondSentPayload = externalApi.requests
              .get("incoming.1")
              .value();
            const thirdSentPayload = externalApi.requests
              .get("incoming.2")
              .value();

            expect(_.get(firstSentPayload, "body.event.event")).to.equal("Event1");
            expect(_.get(secondSentPayload, "body.event.event")).to.equal("Event2");
            expect(thirdSentPayload).to.equal(undefined);

            expect(res.body.flow_control.type).to.equal("next");
            expect(res.statusCode).to.equal(200);
            expect(true).to.be.true;
          },
          e => {
            expect(false).to.be.true;
          }
        );
    },
    10000
  );
});
