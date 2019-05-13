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
    server = bootstrap({ port: 8000, timeout: 25000 });
    externalApi = new MiniApplication();

    externalApi.stubApp("/endpoint_redirect").respond((req, res) => {
      setTimeout(() => {
        res.redirect("/endpoint_ok");
      }, 200);
    });

    externalApi.stubApp("/endpoint_ok").respond((req, res) => {
      setTimeout(() => {
        res.end("ok");
      }, 100);
    });

    return Promise.all([minihull.listen(8001), externalApi.listen(8002)]);
  });

  afterEach(done => {
    server.close(() => {
      Promise.all([minihull.close(), externalApi.close()]).then(() => done());
    });
  });

  it(
    "should return next flow type in case of 3rd part API redirect",
    function() {
      return minihull
        .smartNotifyConnector(
          examplePayload.connector,
          "http://localhost:8000/smart-notifier",
          "user:update",
          examplePayload.messages
        )
        .then(
          res => {
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
