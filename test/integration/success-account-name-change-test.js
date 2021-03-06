const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");
const _ = require("lodash");

const bootstrap = require("./support/bootstrap");
const examplePayload = require("../fixtures/account-change-name.json");

describe("account test - attribute attribute change", () => {
  let minihull;
  let server;
  let externalApi;

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap({ port: 8045, timeout: 2500000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_ok").respond((req, res) => {
      setTimeout(() => {
        res.end("ok");
      }, 100);
    });

    return Promise.all([minihull.listen(8046), externalApi.listen(8047)]);
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
        "http://localhost:8047/endpoint_ok"
      ];
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8045/smart-notifier",
          "account:update",
          examplePayload.messages
        )
        .then(
          res => {
            const firstSentPayload = externalApi.requests
              .get("incoming.0")
              .value();
            console.log(JSON.stringify(firstSentPayload));

            expect(
              _.get(firstSentPayload, "body.changes.account.name")[0]
            ).to.equal("TMP-1");
            expect(
              _.get(firstSentPayload, "body.changes.account.name")[1]
            ).to.equal("TMP Account Name");
            expect(_.get(firstSentPayload, "body.account.name")).to.equal(
              "SomeHullCompany"
            );

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
