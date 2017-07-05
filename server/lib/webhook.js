/* @flow */
import _ from 'lodash';
import axios from 'axios';

export default function webhook({webhooks_urls, hull, payload = {}}: any) {
  return _.map(webhooks_urls, url => axios.post(url, payload)
    .then(
      ({data, status, statusText}) => {
        hull.logger.info('outgoing.user.success', { userIdent: { email: user.email, external_id: user.external_id, hull_id: user.id } });
        hull.logger.debug('webhook.success', {
          userId: payload.user.id,
          status,
          statusText,
          data
        });
      }
    )
    .catch(({response, message: msg}) => {
      let errors = "unknown";
      if (response) {
        const {data, status} = response;
        errors = "webhook failed";

        hull.logger.debug('webhook.error', {message: 'webhook failed', data, status});
      } else {
        errors = msg;
        // Something happened in setting up the request that triggered an Error
        hull.logger.debug('webhook.error', {message: msg});
      }
      hull.logger.error('outgoing.user.error', {
        userIdent: { email: user.email, external_id: user.external_id, hull_id: user.id },
        errors
      });
    })
  );
}
