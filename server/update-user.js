import _ from 'lodash';
import webhook from './webhook';

function getSegmentChanges(webhooks_segments, changes = {}, action = 'left') {
  const { segments = {} } = changes;
  if (!_.size(segments)) return [];
  const current = segments[action] || [];
  if (!current.length) return [];

  // Get list of segments we're validating against for a given changeset
  const filter = _.map(_.filter(webhooks_segments, e => e[action]), 'segment');

  // List of User segments matching entered or left
  return _.filter(current, s => _.includes(filter, s.id));
}

export default function updateUser({ metric, ship, client, isBatch = false }, message = {}) {
  const { user = {}, segments = [], changes = {}, events = [] } = message;
  const { private_settings = {} } = ship;
  const { webhooks_urls = [], synchronized_segments = [], webhooks_events = [], webhooks_attributes = [], webhooks_segments = [] } = private_settings;
  const hull = client;
  hull.logger.info('notification.start', { userId: user.id });

  if (!user || !user.id || !ship || !webhooks_urls.length || !synchronized_segments) {
    hull.logger.error('notification.error', {
      message: "Missing data",
      user: !!user,
      ship: !!ship,
      userId: (user && !!user.id),
      webhooks_urls: !!webhooks_urls
    });
    return false;
  }

  if (!synchronized_segments.length) {
    hull.logger.info('notification.skip', { message: 'No Segments configured. all Users will be skipped' });
    return false;
  }

  if (!webhooks_events.length && !webhooks_segments.length && !webhooks_attributes.length) {
    hull.logger.info('notification.skip', { message: 'No Events, Segments or Attributes configured. No Webhooks will be sent' });
    return false;
  }

  // pluck
  const segmentIds = _.map(segments, 'id');

  // Early return when sending batches. All users go through it. No changes, no events though...
  if (isBatch) {
    metric.increment("ship.outgoing.events");
    webhook({
      hull,
      webhooks_urls,
      payload: { user, segments }
    });
    return false;
  }

  if (!_.intersection(synchronized_segments, segmentIds).length) {
    hull.logger.info('notification.skip', { message: "User doesn't match filtered segments" });
    return false;
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
    _.map(matchedEvents, (event) => {
      metric.increment("ship.outgoing.events");
      hull.logger.info('notification.send', loggingContext);
      webhook({ hull, webhooks_urls, payload: { ...payload, event } });
    });
    return true;
  }

  // User
  // Don't send again if already sent through events.
  if (matchedAttributes.length || matchedEnteredSegments.length || matchedLeftSegments.length) {
    metric.increment("ship.outgoing.events");
    hull.logger.info('notification.send', loggingContext);
    webhook({ hull, webhooks_urls, payload });
    return true;
  }

  hull.logger.info('notification.skip', { userId: user.id, message: "User didn't match any conditions" });
  return false;
}
