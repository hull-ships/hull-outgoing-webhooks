/* @flow */
import _ from "lodash";
import request from "request-promise";
import { version } from "../../package.json";

export default function webhook({
  setFlowControl,
  webhooks_urls,
  hull,
  payload = {},
  metric
}: any) {
  const asUser = hull.asUser(
    _.pick(payload.user, ["id", "email", "external_id"])
  );
  const promises = _.map(webhooks_urls, url => {
    return request({
      method: "POST",
      headers: {
        "User-Agent": `Hull Node Webhooks version: ${version}`
      },
      uri: url,
      body: payload,
      json: true
    })
      .then(({ data, status, statusText }) => {
        metric.increment("ship.service_api.call", 1);
        asUser.logger.info("outgoing.user.success", { url });
        hull.logger.debug("webhook.success", {
          userId: payload.user.id,
          status,
          statusText,
          data
        });
        return null;
      })
      .catch(({ statusCode: status, error, response }) => {
        metric.increment("ship.service_api.error", 1);
        const errorInfo = {
          reason: "Webhook Failed",
          status,
          error,
          message: "See data for further details about the exact error."
        };

        if (status === 429 || status >= 500) {
          setFlowControl({
            type: "retry",
            in: (response.headers["Retry-After"] || 120) * 1000
          });
        }

        const res = {
          payload, error: errorInfo
        }
        metric.increment("ship.service_api.errors", 1);
        asUser.logger.error("outgoing.user.error", res);
        return Promise.resolve(res);
      });
  });
  return Promise.all(promises);
}
