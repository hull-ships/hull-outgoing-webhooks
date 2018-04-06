/* @flow */
const _ = require("lodash");
const superagent = require("superagent");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/lib/utils");

const { version } = require("../../package.json");

function webhook({
  smartNotifierResponse,
  webhooks_urls,
  hull,
  payload = {},
  metric
}: any) {
  const asUser = hull.asUser(
    _.pick(payload.user, ["id", "email", "external_id"])
  );
  const promises = _.map(webhooks_urls, url => {
    return superagent
      .post(url)
      .use(superagentErrorPlugin({ timeout: 20000 }))
      .use(
        superagentInstrumentationPlugin({
          logger: hull.logger,
          metric
        })
      )
      .ok(res => res.status === 200)
      .send(payload)
      .then(response => {
        asUser.logger.info("outgoing.user.success", { url });
        asUser.logger.debug("webhook.success", {
          payload: payload,
          response: response.body
        });
        return null;
      })
      .catch(error => {
        const errorInfo = {
          reason: "Webhook Failed",
          status: error.status,
          error: error.message,
          message: "See error param for further details about the exact error."
        };

        if (error.status === 429 || error.status >= 500) {
          // smartNotifierResponse could be nil if we are consuming a Batch.
          if (smartNotifierResponse && smartNotifierResponse.setFlowControl) {
            smartNotifierResponse.setFlowControl({
              type: "retry",
              in: (error.response.headers["Retry-After"] || 120) * 1000
            });
          }
        }

        const res = {
          payload,
          error: errorInfo
        };
        metric.increment("ship.service_api.errors", 1);
        asUser.logger.error("outgoing.user.error", res);
        return Promise.resolve(res);
      });
  });
  return Promise.all(promises);
}

module.exports = webhook;
