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
  return _.filter(current, s => _.includes(filter, s.name));
}

export default function updateUser({ message = {} }, { ship = {}, hull = {}, isBatch = false }) {
  const { user = {}, segments = [], changes = {}, events = [] } = message;
  const { private_settings = {} } = ship;
  const { webhooks_urls = [], segment_filter = [], webhooks_events = [], webhooks_attributes = [], webhooks_segments = [] } = private_settings;

  hull.logger.info('notification.start', { userId: user.id });

  if (!user || !user.id || !ship || !webhooks_urls.length || !segment_filter) {
    hull.logger.error('notification.error', {
      message: "Missing data",
      user: !!user,
      ship: !!ship,
      userId: (user && !!user.id),
      webhooks_urls: !!webhooks_urls
    });
    return false;
  }

  if (!segment_filter.length) {
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
    webhook({
      hull,
      webhooks_urls,
      payload: { user, segments }
    });
    return false;
  }

  if (!_.intersection(segment_filter, segmentIds).length) {
    hull.logger.info('notification.skip', { message: "User doesn't match filtered segments" });
    return false;
  }

  const filteredSegments = _.intersection(segment_filter, segmentIds);
  const matchedAttributes = _.intersection(webhooks_attributes, _.keys((changes.user || {})));
  const matchedEnteredSegments = getSegmentChanges(webhooks_segments, changes, 'entered');
  const matchedLeftSegments = getSegmentChanges(webhooks_segments, changes, 'left');
  const matchedEvents = _.filter(events, event => _.includes(webhooks_events, event.event));

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
      hull.logger.info('notification.send', loggingContext);
      webhook({ hull, webhooks_urls, payload: { ...payload, event } });
    });
    return true;
  }

  // User
  // Don't send again if already sent through events.
  if (matchedAttributes.length || matchedEnteredSegments.length || matchedLeftSegments.length) {
    hull.logger.info('notification.send', loggingContext);
    webhook({ hull, webhooks_urls, payload });
    return true;
  }

  hull.logger.info('notification.skip', { userId: user.id, message: "User didn't match any conditions" });
  return false;
}
