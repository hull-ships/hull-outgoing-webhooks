/* @flow */
import _ from 'lodash';
import axios from 'axios';

export default function webhook({ webhooks_urls, hull, payload = {} }: any) {
  const asUser = hull.asUser(_.pick(payload.user, ["id", "email", "external_id"]));
  return _.map(webhooks_urls, url => axios.post(url, payload)
    .then(
      ({ data, status, statusText }) => {
        asUser.logger.info('outgoing.user.success');
        hull.logger.debug('webhook.success', {
          userId: payload.user.id,
          status,
          statusText,
          data
        });
      }
    )
    .catch(({ response, message: msg }) => {
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
      asUser.logger.error('outgoing.user.error', { error: errorInfo });
    })
  );
}
