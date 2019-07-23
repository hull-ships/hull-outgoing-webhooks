const _ = require("lodash");

function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings = {} } = ship;
  const {
    webhooks_urls,
    webhooks_account_urls,
    synchronized_segments,
    synchronized_account_segments
  } = private_settings;

  let status = "ok";
  const messages = [];

  if (
    !_.size(synchronized_segments) &&
    !_.size(synchronized_account_segments)
  ) {
    status = "ok";
    messages.push(
      "No user or account segments are listed. Connector won't send any payload."
    );
  }

  if (!_.size(webhooks_urls) && !_.size(webhooks_account_urls)) {
    status = "ok";
    messages.push(
      "No user webhooks configured. Connector won't send any payload."
    );
  }

  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
}

module.exports = statusCheck;
