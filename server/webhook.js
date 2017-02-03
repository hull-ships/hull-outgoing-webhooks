import _ from 'lodash';
import axios from 'axios';

export default function webhook({ webhooks_urls, hull, payload = {} }) {
  return _.map(webhooks_urls, url => axios.post(url, payload)
    .then(
      ({ data, status, statusText }) => hull.logger.info('webhook.success', {
        userId: payload.user.id,
        status,
        statusText,
        data
      }))
    .catch(({ response, message: msg }) => {
      if (response) {
        const { data, status } = response;
        hull.logger.info('webhook.error', { message: 'webhook failed', data, status });
      } else {
        // Something happened in setting up the request that triggered an Error
        hull.logger.error('webhook.error', { message: msg });
      }
    })
  );
}
