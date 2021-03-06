const express = require("express");
const sinon = require("sinon");
const assert = require("assert");
const bodyParser = require("body-parser");

const ClientMock = require("../client-mock");
const webhook = require("../../server/lib/webhook");

const port = 8070;

const mockThrottle = {
  plugin: () => { return () => {} }
};

const listenTo = (app, endpoint, responses) => {
  app.post(`/${endpoint}`, (req, res) => {
    req.on("data", data => {
      responses[endpoint] = data.toString();
      res.send('ok');
    });
  });
};
const createServer = endpoints => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  const res = endpoints.reduce((r, v) => {
    listenTo(app, v, r);
    return r;
  }, {});
  app.listen(port);
  return {app, res};
};

describe("Webhook should increment error counter in case of error", () => {
  const endpoints = ["notification", "notification2"];
  const { app, res } = createServer(endpoints);
  it("should increment errors if an error occured", done => {
    const increment = sinon.spy();
    const value = sinon.spy();
    const metric = { increment, value };
    const payload = {
      user: { id: "user-1234" },
      account: { id: "account-1234" }
    };
    const finish = f => {
      assert(increment.calledWith("ship.service_api.call", 1));
      ["notification"]
      .map(e => assert.equal(res[e], JSON.stringify(payload)));
      done();
    }
    webhook({
      metric,
      url: `http://localhost:${port}/notification`,
      hull: ClientMock(),
      payload
    }, mockThrottle).then(finish, finish);
  });

  it("should send notification", done => {
    const increment = sinon.spy();
    const value = sinon.spy();
    const metric = { increment, value };
    const payload = {
      user: { id: "user-1234" },
      account: { id: "account-1234" }
    };
    const finish = f => {
      assert(increment.alwaysCalledWith("ship.service_api.call", 1));
      assert(increment.calledOnce);
      ["notification"]
      .map(e => assert.equal(res[e], JSON.stringify(payload)));
      done();
    }
    webhook({
      metric,
      url: `http://localhost:${port}/notification`,
      hull: ClientMock(),
      payload
    }, mockThrottle).then(finish, finish);
  });
});
