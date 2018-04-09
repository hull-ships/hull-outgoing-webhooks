const _ = require("lodash");

function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings = {} } = ship;
  const {
    webhooks_urls,
    synchronized_segments,
    webhooks_attributes,
    webhooks_events,
    webhooks_anytime,
    webhooks_segments
  } = private_settings;

  let status = "ok";
  const messages = [];

  if (!_.size(webhooks_urls)) {
    status = "warning";
    messages.push("No webhooks configured. Connector won't send anything");
  }

  if (!_.size(synchronized_segments)) {
    status = "warning";
    messages.push("No segments are listed. Connector won't send anything");
  }

  if (
    !webhooks_anytime &&
    !_.size(webhooks_segments) &&
    !_.some(_.map(webhooks_segments, v => v.entered || v.left)) &&
    !_.size(webhooks_events) &&
    !_.size(webhooks_attributes)
  ) {
    status = "warning";
    messages.push("No output condition active. Connector won't send anything");
  }

  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
}

module.exports = statusCheck;
