/* @flow */
const _ = require("lodash");
const superagent = require("superagent");
const Promise = require("bluebird");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/lib/utils");

const { version } = require("../../package.json");

function webhook(
  { smartNotifierResponse, url, hull, payload = {}, metric }: Object,
  throttle: Object
) {
  const asUser = hull.asUser(
    _.pick(payload.user, ["id", "email", "external_id"])
  );
  let start;
  return superagent
    .post(url)
    .on("request", () => {
      start = process.hrtime();
    })
    .use(throttle.plugin())
    .use(superagentErrorPlugin({ timeout: 20000 }))
    .use(
      superagentInstrumentationPlugin({
        logger: hull.logger,
        metric
      })
    )
    .redirects(0)
    .ok(res => res.status >= 200 && res.status <= 204)
    .send(payload)
    .then(response => {
      const status = response.status;
      const hrTime = process.hrtime(start);
      const elapsed = hrTime[0] * 1000 + hrTime[1] / 1000000;
      asUser.logger.info("outgoing.user.success", { status, url, elapsed });
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
        hull_summary: "",
        error: errorInfo,
        status: error.status
      };
      if (error.status >= 300 && error.status <= 308) {
        res.hull_summary =
          "Server returned a redirect code - see `Connector doesn't support redirects` in documentation";
      }
      asUser.logger.error("outgoing.user.error", res);
      return Promise.resolve(res);
    });
}

module.exports = webhook;
