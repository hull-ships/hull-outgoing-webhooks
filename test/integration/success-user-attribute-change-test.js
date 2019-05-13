const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");
const _ = require("lodash");
const bootstrap = require("./support/bootstrap");
const examplePayload = require("../fixtures/user-change-attribute");

describe("user test - attribute change", () => {
  let minihull;
  let server;
  let externalApi;

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap({ port: 8018, timeout: 250000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_ok").respond((req, res) => {
      setTimeout(() => {
        res.end("ok");
      }, 100);
    });

    return Promise.all([minihull.listen(8019), externalApi.listen(8020)]);
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
        "http://localhost:8020/endpoint_ok"
      ];
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8018/smart-notifier",
          "user:update",
          examplePayload.messages
        )
        .then(
          res => {
            const firstSentPayload = externalApi.requests
              .get("incoming.0")
              .value();
            console.log(JSON.stringify(firstSentPayload));
            expect(_.get(firstSentPayload, "body.changes.user.traits_outreach/custom1")[0]).to.equal("c1-v");
            expect(_.get(firstSentPayload, "body.changes.user.traits_outreach/custom1")[1]).to.equal("c1-value");
            expect(_.get(firstSentPayload, "body.changes.user.username")[0]).to.equal(null);
            expect(_.get(firstSentPayload, "body.changes.user.username")[1]).to.equal("andyhull565");


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
