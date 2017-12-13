/* @flow */
import _ from 'lodash';
import axios from 'axios';

export default function webhook({ webhooks_urls, hull, payload = {}, metric }: any) {
  const asUser = hull.asUser(_.pick(payload.user, ["id", "email", "external_id"]));
  return Promise.all(
    _.map(webhooks_urls, url =>
      axios.post(url, payload)
      .then(({ data, status, statusText }) => {
        metric.increment('ship.service_api.call', 1);
        asUser.logger.info('outgoing.user.success', payload);
        hull.logger.debug('webhook.success', {
          userId: payload.user.id,
          status,
          statusText,
          data
        });
      })
      .catch(({ response, message: msg }) => {
        metric.increment('ship.service_api.call', 1);
        const errorInfo = {
          reason: "unknown"
        };
        if (response) {
          const { data, status } = response;
          errorInfo.reason = "Webhook failed";
          _.set(errorInfo, "message", "See data for further details about the exact error.");
          _.set(errorInfo, "data", data);
          _.set(errorInfo, "status", status);
        } else {
          _.set(errorInfo, "message", msg);
        }
        hull.logger.debug('webhook.error', errorInfo);
        metric.increment('ship.service_api.errors', 1);
        asUser.logger.error('outgoing.user.error', { payload, error: errorInfo });
      })
    )
  );
}
