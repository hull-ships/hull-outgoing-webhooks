/* @flow */
import _ from 'lodash';
import getSegmentChanges from "./get-segment-changes";
import webhook from './webhook';

export default function updateUser({ metric, ship, client, isBatch = false }: any, message: any = {}) {
  const { user = {}, account = {}, segments = [], changes = {}, events = [] } = message;
  const { private_settings = {} } = ship;
  const { webhooks_anytime, webhooks_urls = [], synchronized_segments = [], webhooks_events = [], webhooks_attributes = [], webhooks_segments = [] } = private_settings;
  const hull = client;
  hull.logger.debug('outgoing.user.start', { userId: user.id });
  const asUser = hull.asUser(_.pick(user, ["id", "email", "external_id"]));

  if (!user || !user.id || !ship || !webhooks_urls.length || !synchronized_segments) {
    hull.logger.error('outgoing.user.error', {
      message: "Missing data",
      user: !!user,
      ship: !!ship,
      userId: (user && !!user.id),
      webhooks_urls: !!webhooks_urls
    });
    return Promise.resolve();
  }

  if (!synchronized_segments.length) {
    asUser.logger.info('outgoing.user.skip', {
      reason: "No Segments configured. All Users will be skipped"
    });
    return Promise.resolve();
  }

  if (!webhooks_events.length && !webhooks_segments.length && !webhooks_attributes.length) {
    asUser.logger.info('outgoing.user.skip', {
      reason: "No Events, Segments or Attributes configured. No Webhooks will be sent"
    });
    return Promise.resolve();
  }

  // pluck
  const segmentIds = _.map(segments, 'id');

  // Early return when sending batches. All users go through it. No changes, no events though...
  if (isBatch) {
    metric.increment("ship.outgoing.events");
    return webhook({
      metric,
      hull,
      webhooks_urls,
      payload: { user, segments }
    });
  }

  if (!_.intersection(synchronized_segments, segmentIds).length) {
    asUser.logger.info('outgoing.user.skip', {
      reason: "User doesn't match filtered segments"
    });
    return Promise.resolve();
  }

  const filteredSegments = _.intersection(synchronized_segments, segmentIds);
  let matchedAttributes = _.intersection(webhooks_attributes, _.keys((changes.user || {})));
  const matchedEnteredSegments = getSegmentChanges(webhooks_segments, changes, 'entered');
  const matchedLeftSegments = getSegmentChanges(webhooks_segments, changes, 'left');
  const matchedEvents = _.filter(events, event => _.includes(webhooks_events, event.event));

  // some traits have "traits_" prefix in event payload but not in the settings select field.
  // we give them another try matching prefixed version
  if (_.isEmpty(matchedAttributes)) {
    matchedAttributes = _.intersection(_.map(webhooks_attributes, a => `traits_${a}`), _.keys((changes.user || {})));
  }

  // Payload
  const payload = {
    user,
    account,
    segments,
    changes
  };

  const loggingContext = {
    matchedEvents,
    matchedAttributes,
    filteredSegments,
    matchedEnteredSegments,
    matchedLeftSegments
  };

  // Event: Send once for each matching event.
  if (matchedEvents.length) {
    return Promise.all(_.map(matchedEvents, (event) => {
      metric.increment("ship.outgoing.events");
      hull.logger.debug('notification.send', loggingContext);
      webhook({ metric, hull, webhooks_urls, payload: { ...payload, event } });
    }));
  }

  // User
  // Don't send again if already sent through events.
  if (matchedAttributes.length || matchedEnteredSegments.length || matchedLeftSegments.length || webhooks_anytime) {
    metric.increment("ship.outgoing.events");
    hull.logger.debug('notification.send', loggingContext);
    return webhook({ metric, hull, webhooks_urls, payload });
  }

  asUser.logger.info('outgoing.user.skip', {
    reason: "User didn't match any conditions"
  });
  return Promise.resolve();
}
