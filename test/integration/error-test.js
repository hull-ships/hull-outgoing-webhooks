const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");

const bootstrap = require("./support/bootstrap");
const examplePayload = require("../fixtures/10-users.json");

describe("request feature allowing to call external API", () => {
  let minihull;
  let server;
  let externalApi;

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap({ port: 8006, timeout: 25000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_err").respond((req, res) => {
      setTimeout(() => {
        req.destroy();
      }, 100);
    });

    return Promise.all([minihull.listen(8007), externalApi.listen(8008)]);
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
        "http://localhost:8008/endpoint_error"
      ];
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8006/smart-notifier",
          "user:update",
          examplePayload.messages
        )
        .then(
          res => {
            const firstSentPayload = externalApi.requests
              .get("incoming.0")
              .value();
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
