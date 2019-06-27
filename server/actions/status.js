const _ = require("lodash");

function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const { private_settings = {} } = ship;
  const {
    webhooks_urls,
    webhooks_account_urls,
    synchronized_segments,
    synchronized_account_segments,
    webhooks_attributes,
    webhooks_account_attributes,
    webhooks_events,
    webhooks_account_events,
    webhooks_anytime,
    webhooks_account_anytime,
    webhooks_segments,
    webhooks_account_segments
  } = private_settings;

  let status = "ok";
  const messages = [];

  if (!_.size(webhooks_urls)) {
    status = "warning";
    messages.push(
      "No user webhooks configured. Connector won't send anything for the user."
    );
  }

  if (!_.size(webhooks_account_urls)) {
    status = "warning";
    messages.push(
      "No account webhooks configured. Connector won't send anything for the account."
    );
  }

  if (!_.size(synchronized_segments)) {
    status = "warning";
    messages.push(
      "No user segments are listed. Connector won't send anything for the user."
    );
  }

  if (!_.size(synchronized_account_segments)) {
    status = "warning";
    messages.push(
      "No account segments are listed. Connector won't send anything for the account."
    );
  }

  if (
    !webhooks_anytime &&
    !_.size(webhooks_segments) &&
    !_.some(_.map(webhooks_segments, v => v.entered || v.left)) &&
    !_.size(webhooks_events) &&
    !_.size(webhooks_attributes)
  ) {
    status = "warning";
    messages.push(
      "No user output condition active. Connector won't send anything for the user."
    );
  }

  if (
    !webhooks_account_anytime &&
    !_.size(webhooks_account_segments) &&
    !_.some(_.map(webhooks_account_segments, v => v.entered || v.left)) &&
    !_.size(webhooks_account_events) &&
    !_.size(webhooks_account_attributes)
  ) {
    status = "warning";
    messages.push(
      "No account output condition active. Connector won't send anything for the account."
    );
  }

  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
}

module.exports = statusCheck;
