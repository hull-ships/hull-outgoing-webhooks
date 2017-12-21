/* @flow */
import _ from "lodash";
import request from "request-promise";

export default function webhook({
  webhooks_urls,
  hull,
  payload = {},
  metric
}: any) {
  const claims = _.pick(payload.user, ["id", "email", "external_id"]);
  const asUser = hull.asUser(claims);
  const promises = _.map(webhooks_urls, url => {
    return request({
      method: "POST",
      uri: url,
      body: payload,
      json: true
    }).then(
      ({ data, status, statusText }) => {
        metric.increment("ship.service_api.call", 1);
        asUser.logger.info("outgoing.user.success", { url, claims });
        hull.logger.debug("webhook.success", {
          userId: payload.user.id,
          status,
          statusText,
          data
        });
        return null;
      },
      ({ error, message: msg }) => {
        metric.increment("ship.service_api.error", 1);
        const errorInfo = { reason: "unknown" };
        if (error) {
          const { data, status } = error;
          errorInfo.reason = "Webhook failed";
          _.set(
            errorInfo,
            "message",
            "See data for further details about the exact error."
          );
          _.set(errorInfo, "data", data);
          _.set(errorInfo, "status", status);
        } else {
          _.set(errorInfo, "message", msg);
        }
        hull.logger.debug("webhook.error", errorInfo);
        metric.increment("ship.service_api.errors", 1);
        asUser.logger.error("outgoing.user.error", {
          payload,
          error: errorInfo
        });
        return Promise.resolve({ payload, error: errorInfo })
      }
    );
  });
  return Promise.all(promises);
}
