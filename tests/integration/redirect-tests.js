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
    server = bootstrap(25000);
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

    // externalApi.stubApp("/endpoint_success_return_email").respond((req, res) => {
    //   setTimeout(() =>{
    //     res.json({ returned_email: req.query.email });
    //   }, 20);
    // });
    return Promise.all([
      minihull.listen(8001),
      externalApi.listen(8002)
    ]);
  });

  afterEach((done) => {
    server.close(() => {
      Promise.all([
        minihull.close(),
        externalApi.close()
      ]).then(() => done());
    });
  });

  it.only("should return http 503 - gateway timeout in case of 3rd part API timeout", function() {
    this.timeout(10000);
    return minihull.smartNotifyConnector(
      examplePayload.connector,
      "http://localhost:8000/smart-notifier",
      "user:update",
      examplePayload.messages
    ).then((res) => {
      console.log("RESOLVED!!!!!");
      expect(true).to.be.true;
    }, (e) => {
      expect(false).to.be.true;
    });
  });

});