const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");

const bootstrap = require("./support/bootstrap");
const examplePayload = require("../fixtures/account-no-changes.json");

describe("account test - no changes on the account", () => {
  let minihull;
  let server;
  let externalApi;

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap({ port: 8021, timeout: 250000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_ok").respond((req, res) => {
      setTimeout(() => {
        res.end("ok");
      }, 100);
    });

    return Promise.all([minihull.listen(8022), externalApi.listen(8023)]);
  });

  afterEach(done => {
    server.close(() => {
      Promise.all([minihull.close(), externalApi.close()]).then(() => done());
    });
  });

  it(
    "should return next",
    function() {
      examplePayload.connector.private_settings.webhooks_account_urls = [
        "http://localhost:8023/endpoint_ok"
      ];
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8021/smart-notifier",
          "account:update",
          examplePayload.messages
        )
        .then(
          res => {
            const firstSentPayload = externalApi.requests
              .get("incoming.0")
              .value();

            expect(firstSentPayload).to.equal(undefined);
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
